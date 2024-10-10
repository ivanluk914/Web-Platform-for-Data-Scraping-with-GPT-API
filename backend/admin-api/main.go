package main

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"time"

	_ "go.uber.org/automaxprocs"

	"admin-api/clients"
	"admin-api/config"
	"admin-api/handlers"
	"admin-api/middleware"
	"admin-api/models"
	"admin-api/services"

	"github.com/gin-contrib/cors"
	ginzap "github.com/gin-contrib/zap"
	"github.com/gin-gonic/gin"
	healthcheck "github.com/tavsec/gin-healthcheck"
	"github.com/tavsec/gin-healthcheck/checks"
	hc "github.com/tavsec/gin-healthcheck/config"
	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"

	"go.opentelemetry.io/contrib/instrumentation/github.com/gin-gonic/gin/otelgin"
	"go.opentelemetry.io/contrib/instrumentation/host"
	"go.opentelemetry.io/contrib/instrumentation/runtime"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/otlp/otlpmetric/otlpmetricgrpc"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc"
	"go.opentelemetry.io/otel/propagation"
	sdkmetric "go.opentelemetry.io/otel/sdk/metric"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.20.0"
)

var (
	serviceName = semconv.ServiceNameKey.String("admin-api")
)

func main() {
	// Initialize base context
	ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt)
	defer cancel()

	// Initialize logger
	var err error
	logger, err := zap.NewProduction()
	if err != nil {
		logger.Fatal("Failed to initialize logger", zap.Error(err))
	}
	defer logger.Sync()

	// Replace the global logger
	zap.ReplaceGlobals(logger)

	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		logger.Fatal("Failed to load configuration", zap.Error(err))
	}

	// Initialize telemetry
	cleanUp := initTelemetry(ctx, logger, cfg.Otel)
	defer cleanUp()

	// Initialize database connections
	err = models.InitDB(cfg.Postgres, cfg.Scylla, cfg.Redis)
	if err != nil {
		logger.Fatal("Failed to initialize database connections", zap.Error(err))
	}

	// Initialize router
	if cfg.Server.IsProd() {
		gin.SetMode(gin.ReleaseMode)
	}
	r := gin.Default()

	// Use zap logger for Gin
	r.Use(ginzap.Ginzap(logger, time.RFC3339, true))
	r.Use(ginzap.RecoveryWithZap(logger, true))

	r.Use(cors.Default())

	healthcheck.New(r, hc.DefaultConfig(), []checks.Check{})

	// Configure dependencies
	auth0Client, err := clients.NewAuthClient(logger, cfg.Auth0)
	if err != nil {
		logger.Fatal("Failed to initialize Auth0 client", zap.Error(err))
	}

	taskService := services.NewTaskService(logger)
	userService := services.NewUserService(logger, auth0Client)

	// Setup routes
	api := r.Group("/api")
	if cfg.Server.IsProd() {
		api.Use(middleware.JWTValidationMiddleware(logger, cfg.Auth0))
		api.Use(otelgin.Middleware(serviceName.Value.AsString()))
	}

	handlers.SetupUserRoutes(api, userService)
	handlers.SetupTaskRoutes(api, taskService)

	// Start server
	logger.Info("Starting server", zap.String("address", cfg.Server.Address))
	if err := r.Run(cfg.Server.Address); err != nil {
		logger.Fatal("Failed to start server", zap.Error(err))
	}
}

func initTelemetry(ctx context.Context, logger *zap.Logger, cfg config.OtelConfig) func() {
	// Initialize grpc connection
	conn, err := initGrpcConn(cfg)
	if err != nil {
		logger.Fatal("Failed to initialize connection", zap.Error(err))
	}

	res, err := resource.New(ctx, resource.WithAttributes(serviceName))
	if err != nil {
		logger.Fatal("Failed to initialize resource", zap.Error(err))
	}

	// Initialize tracer
	tracer, err := initTracerProvider(ctx, res, conn)
	if err != nil {
		logger.Fatal("Failed to initialize tracer", zap.Error(err))
	}

	// Initialize metrics
	metrics, err := initMeterProvider(ctx, res, conn)
	if err != nil {
		logger.Fatal("Failed to initialize meter", zap.Error(err))
	}

	// Start host metrics
	err = host.Start(host.WithMeterProvider(metrics))
	if err != nil {
		logger.Fatal("Failed to start host metrics", zap.Error(err))
	}

	// Start runtime metrics
	err = runtime.Start(runtime.WithMinimumReadMemStatsInterval(time.Second))
	if err != nil {
		logger.Fatal("Failed to start runtime metrics", zap.Error(err))
	}

	cleanUp := func() {
		if err := tracer.Shutdown(ctx); err != nil {
			logger.Error("Error shutting down tracer provider", zap.Error(err))
		}
		if err := metrics.Shutdown(ctx); err != nil {
			logger.Error("Error shutting down meter provider", zap.Error(err))
		}
	}

	return cleanUp
}

func initGrpcConn(cfg config.OtelConfig) (*grpc.ClientConn, error) {
	conn, err := grpc.NewClient(cfg.Endpoint, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		return nil, fmt.Errorf("failed to create gRPC connection to collector: %w", err)
	}

	return conn, err
}

func initTracerProvider(ctx context.Context, res *resource.Resource, conn *grpc.ClientConn) (*sdktrace.TracerProvider, error) {
	traceExporter, err := otlptracegrpc.New(ctx, otlptracegrpc.WithGRPCConn(conn))
	if err != nil {
		return nil, fmt.Errorf("failed to create trace exporter: %w", err)
	}

	bsp := sdktrace.NewBatchSpanProcessor(traceExporter)
	tracerProvider := sdktrace.NewTracerProvider(
		sdktrace.WithSampler(sdktrace.AlwaysSample()),
		sdktrace.WithResource(res),
		sdktrace.WithSpanProcessor(bsp),
	)
	otel.SetTracerProvider(tracerProvider)

	otel.SetTextMapPropagator(propagation.NewCompositeTextMapPropagator(propagation.TraceContext{}, propagation.Baggage{}))
	return tracerProvider, err
}

func initMeterProvider(ctx context.Context, res *resource.Resource, conn *grpc.ClientConn) (*sdkmetric.MeterProvider, error) {
	metricExporter, err := otlpmetricgrpc.New(ctx, otlpmetricgrpc.WithGRPCConn(conn))
	if err != nil {
		return nil, fmt.Errorf("failed to create metrics exporter: %w", err)
	}

	meterProvider := sdkmetric.NewMeterProvider(
		sdkmetric.WithReader(sdkmetric.NewPeriodicReader(metricExporter)),
		sdkmetric.WithResource(res),
	)
	otel.SetMeterProvider(meterProvider)
	return meterProvider, nil
}
