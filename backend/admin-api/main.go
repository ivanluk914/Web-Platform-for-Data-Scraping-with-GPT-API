package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"time"

	_ "go.uber.org/automaxprocs"
	"go.uber.org/zap/zapcore"

	"admin-api/clients"
	"admin-api/config"
	"admin-api/handlers"
	"admin-api/middleware"
	"admin-api/models"
	"admin-api/services"

	"github.com/gin-contrib/cors"
	ginzap "github.com/gin-contrib/zap"
	"github.com/gin-gonic/gin"
	"github.com/grafana/pyroscope-go"
	healthcheck "github.com/tavsec/gin-healthcheck"
	"github.com/tavsec/gin-healthcheck/checks"
	hc "github.com/tavsec/gin-healthcheck/config"
	"github.com/uptrace/opentelemetry-go-extra/otelzap"
	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"

	otelpyroscope "github.com/grafana/otel-profiling-go"
	otelzapbridge "go.opentelemetry.io/contrib/bridges/otelzap"
	"go.opentelemetry.io/contrib/instrumentation/github.com/gin-gonic/gin/otelgin"
	"go.opentelemetry.io/contrib/instrumentation/host"
	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
	otelruntime "go.opentelemetry.io/contrib/instrumentation/runtime"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/otlp/otlplog/otlploghttp"
	"go.opentelemetry.io/otel/exporters/otlp/otlpmetric/otlpmetricgrpc"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc"
	"go.opentelemetry.io/otel/log/global"
	"go.opentelemetry.io/otel/propagation"
	sdklog "go.opentelemetry.io/otel/sdk/log"
	sdkmetric "go.opentelemetry.io/otel/sdk/metric"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.20.0"
	"go.opentelemetry.io/otel/trace"
)

var (
	serviceName = "admin-api"
)

func main() {
	var err error

	// Initialize base context
	ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt)
	defer cancel()

	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		panic(fmt.Errorf("failed to load configuration, err=%w", err))
	}

	// Initialize telemetry
	logger, cleanUp := initTelemetry(ctx, cfg)
	defer cleanUp()

	httpClient := initHttpConn()

	// Initialize database connections
	err = models.InitDB(ctx, logger, cfg.Postgres, cfg.Scylla, cfg.Redis)
	if err != nil {
		logger.Fatal("Failed to initialize database connections", zap.Error(err))
	}

	// Initialize router
	if cfg.Server.IsProd() {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.Default()

	// CORS configuration
	corsConfig := cors.DefaultConfig()
	corsConfig.AllowOrigins = cfg.CORS.AllowOrigins
	corsConfig.AllowHeaders = append(corsConfig.AllowHeaders, "Authorization")

	r.Use(cors.New(corsConfig))

	// Use zap logger for Gin
	r.Use(otelgin.Middleware(serviceName, otelgin.WithGinFilter(func(c *gin.Context) bool {
		return c.Request.URL.Path != "/healthz"
	})))
	r.Use(ginzap.GinzapWithConfig(logger, &ginzap.Config{
		UTC:        true,
		TimeFormat: time.RFC3339,
		SkipPaths:  []string{"/healthz"},
		Context: ginzap.Fn(func(c *gin.Context) []zapcore.Field {
			fields := []zapcore.Field{}
			if requestID := c.Writer.Header().Get("X-Request-Id"); requestID != "" {
				fields = append(fields, zap.String("request_id", requestID))
			}
			if trace.SpanContextFromContext(c.Request.Context()).IsValid() {
				fields = append(fields, zap.String("trace_id", trace.SpanContextFromContext(c.Request.Context()).TraceID().String()))
				fields = append(fields, zap.String("span_id", trace.SpanContextFromContext(c.Request.Context()).SpanID().String()))
			}
			return fields
		}),
	}))
	r.Use(ginzap.RecoveryWithZap(logger, true))

	r.Use(cors.Default())

	healthcheck.New(r, hc.DefaultConfig(), []checks.Check{})

	// Configure dependencies
	auth0Client, err := clients.NewAuthClient(logger, httpClient, cfg.Auth0)
	if err != nil {
		logger.Fatal("Failed to initialize Auth0 client", zap.Error(err))
	}

	taskRunArtifactRepository := models.NewTaskRunArtifactRepository(models.GetScylla())

	taskService := services.NewTaskService(logger, taskRunArtifactRepository)
	userService := services.NewUserService(logger, auth0Client)

	// Setup routes
	api := r.Group("/api")
	// if cfg.Server.IsProd() {
	api.Use(middleware.JWTValidationMiddleware(logger, cfg.Auth0))
	// }

	handlers.SetupUserRoutes(api, userService)
	handlers.SetupTaskRoutes(api, taskService)

	// Start server
	logger.Info("Starting server", zap.String("address", cfg.Server.Address))
	if err := r.Run(cfg.Server.Address); err != nil {
		logger.Fatal("Failed to start server", zap.Error(err))
	}
}

func initTelemetry(ctx context.Context, cfg *config.Config) (*otelzap.Logger, func()) {
	grpcClient, err := initGrpcConn(cfg.Otel)
	if err != nil {
		panic(fmt.Errorf("failed to initialize gRPC client, err=%w", err))
	}

	metaRes, err := resource.New(
		ctx,
		resource.WithAttributes(
			semconv.ServiceNameKey.String(serviceName),
			semconv.CloudRegionKey.String(cfg.Server.Region),
		),
		resource.WithOS(),
		resource.WithProcess(),
		resource.WithContainer(),
		resource.WithHost(),
	)
	if err != nil {
		panic(fmt.Errorf("failed to initialize meta resource, err=%w", err))
	}

	res, err := resource.Merge(
		resource.Default(),
		metaRes,
	)
	if err != nil {
		panic(fmt.Errorf("failed to merge resource, err=%w", err))
	}

	// Initialize tracer
	tracer, err := initTracerProvider(ctx, res, grpcClient)
	if err != nil {
		panic(fmt.Errorf("failed to initialize tracer, err=%w", err))
	}

	// Initialize metrics
	metrics, err := initMeterProvider(ctx, res, grpcClient)
	if err != nil {
		panic(fmt.Errorf("failed to initialize meter, err=%w", err))
	}

	// Start host metrics
	err = host.Start(host.WithMeterProvider(metrics))
	if err != nil {
		panic(fmt.Errorf("failed to start host metrics, err=%w", err))
	}

	// Start runtime metrics
	err = otelruntime.Start(otelruntime.WithMinimumReadMemStatsInterval(time.Second))
	if err != nil {
		panic(fmt.Errorf("failed to start runtime metrics, err=%w", err))
	}

	profiler, err := initPyroscopeProfiling(cfg.Otel)
	if err != nil {
		panic(fmt.Errorf("failed to initialize Pyroscope profiler, err=%w", err))
	}

	logProvider, err := initLogProvider(ctx, res, cfg.Otel)
	if err != nil {
		panic(fmt.Errorf("failed to initialize log provider, err=%w", err))
	}

	z := zap.New(otelzapbridge.NewCore(serviceName, otelzapbridge.WithLoggerProvider(logProvider)))
	logger := otelzap.New(z, otelzap.WithMinLevel(zapcore.InfoLevel), otelzap.WithStackTrace(true))
	undoReplaceGlobalLogger := otelzap.ReplaceGlobals(logger)

	cleanUp := func() {
		logger.Sync()
		undoReplaceGlobalLogger()

		if err := tracer.Shutdown(ctx); err != nil {
			logger.Error("Error shutting down tracer provider", zap.Error(err))
		}
		if err := metrics.Shutdown(ctx); err != nil {
			logger.Error("Error shutting down meter provider", zap.Error(err))
		}
		if err := profiler.Stop(); err != nil {
			logger.Error("Error stopping Pyroscope profiler", zap.Error(err))
		}
		if err := logProvider.Shutdown(ctx); err != nil {
			logger.Error("Error shutting down log provider", zap.Error(err))
		}
	}

	return logger, cleanUp
}

func initGrpcConn(cfg config.OtelConfig) (*grpc.ClientConn, error) {
	conn, err := grpc.NewClient(cfg.Endpoint, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		return nil, fmt.Errorf("failed to create gRPC connection to collector: %w", err)
	}

	return conn, err
}

func initHttpConn() *http.Client {
	client := &http.Client{Transport: otelhttp.NewTransport(http.DefaultTransport)}

	return client
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
	otel.SetTracerProvider(otelpyroscope.NewTracerProvider(tracerProvider))

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

func initLogProvider(ctx context.Context, res *resource.Resource, cfg config.OtelConfig) (*sdklog.LoggerProvider, error) {
	exporter, err := otlploghttp.New(ctx, otlploghttp.WithEndpoint(cfg.EndpointHttp), otlploghttp.WithInsecure())
	if err != nil {
		return nil, fmt.Errorf("failed to create logging exporter: %w", err)
	}

	processor := sdklog.NewBatchProcessor(exporter)
	provider := sdklog.NewLoggerProvider(
		sdklog.WithResource(res),
		sdklog.WithProcessor(processor),
	)
	global.SetLoggerProvider(provider)
	return provider, nil
}

func initPyroscopeProfiling(cfg config.OtelConfig) (*pyroscope.Profiler, error) {
	profiler, err := pyroscope.Start(pyroscope.Config{
		ApplicationName: serviceName,
		ServerAddress:   cfg.PyroscopeURL,
		ProfileTypes: []pyroscope.ProfileType{
			pyroscope.ProfileCPU,
			pyroscope.ProfileAllocObjects,
			pyroscope.ProfileAllocSpace,
			pyroscope.ProfileInuseObjects,
			pyroscope.ProfileInuseSpace,
			pyroscope.ProfileGoroutines,
			pyroscope.ProfileMutexCount,
			pyroscope.ProfileMutexDuration,
			pyroscope.ProfileBlockCount,
			pyroscope.ProfileBlockDuration,
		},
	})

	return profiler, err
}
