package models

import (
	"context"
	"errors"
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

func SetUserCache(ctx context.Context, user *User) error {
	if user == nil || user.ID == nil {
		return errors.New("user is nil or has no ID")
	}

	userJSON, err := sonic.Marshal(user)
	if err != nil {
		return err
	}

	// Cache the user for 1 hour
	return redisClient.Set(ctx, fmt.Sprintf("user:%s", *user.ID), userJSON, time.Hour).Err()
}

func ClearUserCache(ctx context.Context, userID string) error {
	return redisClient.Del(ctx, fmt.Sprintf("user:%s", userID)).Err()
}

func GetUserFromCache(ctx context.Context, userID string) (*User, error) {
	userJSON, err := redisClient.Get(ctx, fmt.Sprintf("user:%s", userID)).Result()
	if err != nil {
		if err == redis.Nil {
			return nil, nil // User not found in cache
		}
		return nil, err
	}

	var user User
	err = sonic.UnmarshalString(userJSON, &user)
	if err != nil {
		return nil, err
	}

	return &user, nil
}

func SetUserRolesCache(ctx context.Context, userID string, roles []UserRole) error {
	rolesJSON, err := sonic.Marshal(roles)
	if err != nil {
		return err
	}

	// Cache the user roles for 1 hour
	return redisClient.Set(ctx, fmt.Sprintf("user-roles:%s", userID), rolesJSON, time.Hour).Err()
}

func ClearUserRolesCache(ctx context.Context, userID string) error {
	return redisClient.Del(ctx, fmt.Sprintf("user-roles:%s", userID)).Err()
}

func GetUserRolesFromCache(ctx context.Context, userID string) ([]UserRole, error) {
	rolesJSON, err := redisClient.Get(ctx, fmt.Sprintf("user-roles:%s", userID)).Result()
	if err != nil {
		if err == redis.Nil {
			return nil, nil // User roles not found in cache
		}
		return nil, err
	}

	var roles []UserRole
	err = sonic.UnmarshalString(rolesJSON, &roles)
	if err != nil {
		return nil, err
	}

	return roles, nil
}
