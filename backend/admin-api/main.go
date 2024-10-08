package main

import (
	"log"
	"time"

	"admin-api/config"
	"admin-api/handlers"
	"admin-api/middleware"
	"admin-api/models"
	"admin-api/services"

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
		log.Fatalf("Failed to initialize logger: %v", err)
	}
	defer logger.Sync()

	// Replace the global logger
	zap.ReplaceGlobals(logger)

	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	// Initialize database connections
	err = models.InitDB(cfg.Postgres.URL, cfg.Scylla.Hosts, cfg.Redis.Address)
	if err != nil {
		logger.Fatal("Failed to initialize database connections", zap.Error(err))
	}

	// Initialize router
	r := gin.Default()

	// Use zap logger for Gin
	r.Use(ginzap.Ginzap(logger, time.RFC3339, true))
	r.Use(ginzap.RecoveryWithZap(logger, true))

	healthcheck.New(r, hc.DefaultConfig(), []checks.Check{})

	// Initialize middleware
	authMiddleware := middleware.Auth0Middleware(cfg.Auth0)

	jobService := services.NewJobService(logger)

	// Setup routes
	api := r.Group("/api")
	api.Use(authMiddleware)

	api.GET("/users", handlers.GetUsers)
	api.POST("/users", handlers.CreateUser)

	handlers.SetupJobRoutes(api, jobService)

	// Start server
	logger.Info("Starting server", zap.String("address", cfg.Server.Address))
	if err := r.Run(cfg.Server.Address); err != nil {
		logger.Fatal("Failed to start server", zap.Error(err))
	}
}
