package models

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

func SetJobCache(ctx context.Context, job *Job) error {
	jobJSON, err := json.Marshal(job)
	if err != nil {
		return err
	}

	// Cache the job for 1 hour
	return redisClient.Set(ctx, fmt.Sprintf("job:%d", job.ID), jobJSON, time.Hour).Err()
}

func ClearJobCache(ctx context.Context, jobID uint64) error {
	return redisClient.Del(ctx, fmt.Sprintf("job:%d", jobID)).Err()
}

func GetJobFromCache(ctx context.Context, jobID uint64) (*Job, error) {
	jobJSON, err := redisClient.Get(ctx, fmt.Sprintf("job:%d", jobID)).Result()
	if err != nil {
		if err == redis.Nil {
			return nil, nil // Job not found in cache
		}
		return nil, err
	}

	var job Job
	err = json.Unmarshal([]byte(jobJSON), &job)
	if err != nil {
		return nil, err
	}

	return &job, nil
}
