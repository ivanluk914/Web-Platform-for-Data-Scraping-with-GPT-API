package main

import (
	"time"

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
	_ "go.uber.org/automaxprocs"
	"go.uber.org/zap"
)

var logger *zap.Logger

func main() {
	// Initialize logger
	var err error
	logger, err = zap.NewProduction()
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
	}

	handlers.SetupUserRoutes(api, userService)
	handlers.SetupTaskRoutes(api, taskService)

	// Start server
	logger.Info("Starting server", zap.String("address", cfg.Server.Address))
	if err := r.Run(cfg.Server.Address); err != nil {
		logger.Fatal("Failed to start server", zap.Error(err))
	}
}
