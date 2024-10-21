package models

import (
	"context"
	"fmt"
	"time"

	"github.com/bytedance/sonic"
	"github.com/redis/go-redis/v9"
)

func SetTaskCache(ctx context.Context, task *TaskDto) error {
	taskJSON, err := sonic.Marshal(task)
	if err != nil {
		return err
	}

	// Cache the task for 1 hour
	return redisClient.Set(ctx, fmt.Sprintf("task:%s", task.ID), taskJSON, time.Hour).Err()
}

func ClearTaskCache(ctx context.Context, taskID uint64) error {
	return redisClient.Del(ctx, fmt.Sprintf("task:%d", taskID)).Err()
}

func GetTaskFromCache(ctx context.Context, taskID uint64) (*TaskDto, error) {
	taskJSON, err := redisClient.Get(ctx, fmt.Sprintf("task:%d", taskID)).Result()
	if err != nil {
		if err == redis.Nil {
			return nil, nil // Task not found in cache
		}
		return nil, err
	}

	var task TaskDto
	err = sonic.UnmarshalString(taskJSON, &task)
	if err != nil {
		return nil, err
	}

	return &task, nil
}
