package models

import (
	"context"

	"admin-api/config"

	"github.com/gocql/gocql"
	"github.com/pkg/errors"
	"github.com/redis/go-redis/extra/redisotel/v9"
	"github.com/redis/go-redis/v9"
	"github.com/uptrace/opentelemetry-go-extra/otelzap"
	"go.opentelemetry.io/contrib/instrumentation/github.com/gocql/gocql/otelgocql"
	"go.uber.org/zap"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/plugin/opentelemetry/tracing"
)

var (
	db            *gorm.DB
	scyllaSession *gocql.Session
	redisClient   *redis.Client
)

func InitDB(ctx context.Context, logger *otelzap.Logger, postgresConfig config.PostgresConfig,
	scyllaConfig config.ScyllaConfig, redisConfig config.RedisConfig) error {
	// Initialize PostgreSQL
	var err error
	db, err = gorm.Open(postgres.Open(postgresConfig.URL), &gorm.Config{})
	if err != nil {
		logger.Ctx(ctx).Error("Failed to connect to PostgreSQL", zap.Error(err))
		return err
	}

	if err := db.Use(tracing.NewPlugin()); err != nil {
		logger.Ctx(ctx).Error("Failed to initialize opentelemetry tracing plugin", zap.Error(err))
	}

	// Auto Migrate the schema
	if err := migrateSchemas(); err != nil {
		logger.Ctx(ctx).Error("Failed to auto migrate schema", zap.Error(err))
		return err
	}

	// Initialize ScyllaDB
	cluster := gocql.NewCluster(scyllaConfig.Hosts...)
	cluster.Keyspace = scyllaConfig.Keyspace
	scyllaSession, err = otelgocql.NewSessionWithTracing(
		ctx,
		cluster,
	)

	if err != nil {
		logger.Ctx(ctx).Error("Failed to connect to ScyllaDB", zap.Error(err))
		return err
	}

	// Initialize Redis
	redisClient = redis.NewClient(&redis.Options{
		Addr: redisConfig.Address,
	})

	if err := redisotel.InstrumentTracing(redisClient); err != nil {
		logger.Ctx(ctx).Error("Failed to initialize redis tracing", zap.Error(err))
		return err
	}
	if err := redisotel.InstrumentMetrics(redisClient); err != nil {
		logger.Ctx(ctx).Error("Failed to initialize redis metrics", zap.Error(err))
		return err
	}

	logger.Ctx(ctx).Info("Database connections initialized successfully")
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

func SetScylla(rc *gocql.Session) {
	scyllaSession = rc
}

func GetScylla() *gocql.Session {
	return scyllaSession
}

func migrateSchemas() error {
	if err := db.AutoMigrate(&Task{}); err != nil {
		return errors.Wrap(err, "Failed to auto migrate Task schema")
	}
	if err := db.AutoMigrate(&TaskRun{}); err != nil {
		return errors.Wrap(err, "Failed to auto migrate TaskRun schema")
	}
	return nil
}
