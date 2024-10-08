package models

import (
	"context"
	"encoding/json"
	"testing"
	"time"

	"github.com/alicebob/miniredis/v2"
	"github.com/bytedance/sonic"
	"github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

func setupMiniRedis(t *testing.T) (*miniredis.Miniredis, *redis.Client) {
	mr, err := miniredis.Run()
	require.NoError(t, err)

	client := redis.NewClient(&redis.Options{
		Addr: mr.Addr(),
	})

	return mr, client
}

func TestSetJobCache(t *testing.T) {
	mr, client := setupMiniRedis(t)
	defer mr.Close()
	redisClient = client

	ctx := context.Background()
	job := &Job{
		Model:          gorm.Model{ID: 1},
		Owner:          "test",
		TaskDefinition: json.RawMessage("{}"),
		TaskId:         "test",
		Status:         JobStatusCreated,
	}

	err := SetJobCache(ctx, job)
	assert.NoError(t, err)

	// Verify the job was set in Redis
	val, err := mr.Get("job:1")
	assert.NoError(t, err)

	var storedJob Job
	err = sonic.UnmarshalString(val, &storedJob)
	assert.NoError(t, err)
	assert.Equal(t, job, &storedJob)

	// Verify expiration was set (allowing for small timing differences)
	ttl := mr.TTL("job:1")
	assert.InDelta(t, time.Hour.Seconds(), ttl.Seconds(), 1)
}

func TestClearJobCache(t *testing.T) {
	mr, client := setupMiniRedis(t)
	defer mr.Close()
	redisClient = client

	ctx := context.Background()
	jobID := uint64(1)

	// Set a job in the cache first
	mr.Set("job:1", "{\"ID\":1,\"Title\":\"Test Job\"}")

	err := ClearJobCache(ctx, jobID)
	assert.NoError(t, err)

	// Verify the job was removed from Redis
	exists := mr.Exists("job:1")
	assert.False(t, exists)
}

func TestGetJobFromCache(t *testing.T) {
	mr, client := setupMiniRedis(t)
	defer mr.Close()
	redisClient = client

	ctx := context.Background()
	jobID := uint64(1)

	t.Run("Job found in cache", func(t *testing.T) {
		job := &Job{
			Model:          gorm.Model{ID: 1},
			Owner:          "test",
			TaskDefinition: json.RawMessage("{}"),
			TaskId:         "test",
			Status:         JobStatusCreated,
		}
		jobJSON, _ := sonic.Marshal(job)
		mr.Set("job:1", string(jobJSON))

		result, err := GetJobFromCache(ctx, jobID)
		assert.NoError(t, err)
		assert.Equal(t, job, result)
	})

	t.Run("Job not found in cache", func(t *testing.T) {
		mr.Del("job:1")

		result, err := GetJobFromCache(ctx, jobID)
		assert.NoError(t, err)
		assert.Nil(t, result)
	})

	t.Run("Redis error", func(t *testing.T) {
		mr.Close()

		result, err := GetJobFromCache(ctx, jobID)
		assert.Error(t, err)
		assert.Nil(t, result)
	})
}
