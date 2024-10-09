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

func TestSetTaskCache(t *testing.T) {
	mr, client := setupMiniRedis(t)
	defer mr.Close()
	redisClient = client

	ctx := context.Background()
	task := &Task{
		Model:          gorm.Model{ID: 1},
		Owner:          "test",
		TaskDefinition: json.RawMessage("{}"),
		TaskId:         "test",
		Status:         TaskStatusCreated,
	}

	err := SetTaskCache(ctx, task)
	assert.NoError(t, err)

	// Verify the task was set in Redis
	val, err := mr.Get("task:1")
	assert.NoError(t, err)

	var storedTask Task
	err = sonic.UnmarshalString(val, &storedTask)
	assert.NoError(t, err)
	assert.Equal(t, task, &storedTask)

	// Verify expiration was set (allowing for small timing differences)
	ttl := mr.TTL("task:1")
	assert.InDelta(t, time.Hour.Seconds(), ttl.Seconds(), 1)
}

func TestClearTaskCache(t *testing.T) {
	mr, client := setupMiniRedis(t)
	defer mr.Close()
	redisClient = client

	ctx := context.Background()
	taskID := uint64(1)

	// Set a task in the cache first
	mr.Set("task:1", "{\"ID\":1,\"Title\":\"Test Task\"}")

	err := ClearTaskCache(ctx, taskID)
	assert.NoError(t, err)

	// Verify the task was removed from Redis
	exists := mr.Exists("task:1")
	assert.False(t, exists)
}

func TestGetTaskFromCache(t *testing.T) {
	mr, client := setupMiniRedis(t)
	defer mr.Close()
	redisClient = client

	ctx := context.Background()
	taskID := uint64(1)

	t.Run("Task found in cache", func(t *testing.T) {
		task := &Task{
			Model:          gorm.Model{ID: 1},
			Owner:          "test",
			TaskDefinition: json.RawMessage("{}"),
			TaskId:         "test",
			Status:         TaskStatusCreated,
		}
		taskJSON, _ := sonic.Marshal(task)
		mr.Set("task:1", string(taskJSON))

		result, err := GetTaskFromCache(ctx, taskID)
		assert.NoError(t, err)
		assert.Equal(t, task, result)
	})

	t.Run("Task not found in cache", func(t *testing.T) {
		mr.Del("task:1")

		result, err := GetTaskFromCache(ctx, taskID)
		assert.NoError(t, err)
		assert.Nil(t, result)
	})

	t.Run("Redis error", func(t *testing.T) {
		mr.Close()

		result, err := GetTaskFromCache(ctx, taskID)
		assert.Error(t, err)
		assert.Nil(t, result)
	})
}
