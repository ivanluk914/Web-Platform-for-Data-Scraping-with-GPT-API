package models

import (
	"admin-api/config"
	"context"

	"github.com/gocql/gocql"
	"github.com/redis/go-redis/v9"
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

func InitDB(postgresConfig config.PostgresConfig, scyllaConfig config.ScyllaConfig, redisConfig config.RedisConfig) error {
	logger = zap.L()

	// Initialize PostgreSQL
	var err error
	db, err = gorm.Open(postgres.Open(postgresConfig.URL), &gorm.Config{})
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
	cluster := gocql.NewCluster(scyllaConfig.Hosts...)
	cluster.Keyspace = scyllaConfig.Keyspace
	scyllaSession, err = cluster.CreateSession()
	if err != nil {
		logger.Error("Failed to connect to ScyllaDB", zap.Error(err))
		return err
	}

	// Initialize Redis
	redisClient = redis.NewClient(&redis.Options{
		Addr: redisConfig.Address,
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

func SetDB(database *gorm.DB) {
	db = database
}

func GetDB() *gorm.DB {
	return db
}

func SetRedis(rc *redis.Client) {
	redisClient = rc
}

func GetRedis() *redis.Client {
	return redisClient
}
