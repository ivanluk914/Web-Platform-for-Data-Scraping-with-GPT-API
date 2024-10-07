package models

import (
	"context"

	"github.com/go-redis/redis/v8"
	"github.com/gocql/gocql"
	"go.uber.org/zap"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var (
	db            *gorm.DB
	scyllaSession *gocql.Session
	redisClient   *redis.Client
	logger        *zap.Logger
)

func InitDB(postgresURL string, scyllaHosts []string, redisAddress string) error {
	logger = zap.L()

	// Initialize PostgreSQL
	var err error
	db, err = gorm.Open(postgres.Open(postgresURL), &gorm.Config{})
	if err != nil {
		logger.Error("Failed to connect to PostgreSQL", zap.Error(err))
		return err
	}

	// Auto Migrate the schema
	if err := db.AutoMigrate(&User{}); err != nil {
		logger.Error("Failed to auto migrate schema", zap.Error(err))
		return err
	}

	// Initialize ScyllaDB
	cluster := gocql.NewCluster(scyllaHosts...)
	cluster.Keyspace = "your_keyspace"
	scyllaSession, err = cluster.CreateSession()
	if err != nil {
		logger.Error("Failed to connect to ScyllaDB", zap.Error(err))
		return err
	}

	// Initialize Redis
	redisClient = redis.NewClient(&redis.Options{
		Addr: redisAddress,
	})

	// Test Redis connection
	ctx := context.Background()
	_, err = redisClient.Ping(ctx).Result()
	if err != nil {
		logger.Error("Failed to connect to Redis", zap.Error(err))
		return err
	}

	logger.Info("Database connections initialized successfully")
	return nil
}
