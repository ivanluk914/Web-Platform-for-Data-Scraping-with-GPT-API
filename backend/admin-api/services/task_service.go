package services

import (
	"admin-api/models"
	"context"
	"errors"
	"fmt"
	"strconv"

	"github.com/bytedance/sonic"
	"github.com/uptrace/opentelemetry-go-extra/otelzap"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

type TaskService struct {
	logger *otelzap.Logger
}

func NewTaskService(logger *otelzap.Logger) *TaskService {
	return &TaskService{logger: logger}
}

func (s *TaskService) GetTasksByUserId(ctx context.Context, userId string) ([]models.Task, error) {
	tasks, err := models.GetTasksByUserId(userId)
	if err != nil {
		s.logger.Ctx(ctx).Error("Failed find tasks", zap.Error(err))
		return nil, err
	}
	return tasks, nil
}

func (s *TaskService) GetTaskById(ctx context.Context, taskID string) (*models.Task, error) {
	taskIDUint, err := strconv.ParseUint(taskID, 10, 64)
	if err != nil {
		s.logger.Ctx(ctx).Error("Failed to parse task id", zap.Error(err))
		return nil, err
	}

	j, err := models.GetTaskFromCache(ctx, taskIDUint)
	if err != nil {
		s.logger.Ctx(ctx).Error("Error while getting task from cache", zap.Error(err))
		return nil, err
	}
	if j != nil {
		return j, nil
	}

	task, err := models.GetTaskById(taskIDUint)
	if err != nil {
		s.logger.Ctx(ctx).Error("Error while getting task from db", zap.Error(err))
		return nil, err
	}

	if err := models.SetTaskCache(ctx, task); err != nil {
		s.logger.Ctx(ctx).Error("Error while setting task in cache", zap.Error(err))
		return nil, err
	}

	return task, nil
}

func (s *TaskService) CreateTask(ctx context.Context, td models.TaskDefinition, userID string) (*models.Task, error) {
	taskJson, err := sonic.Marshal(td)
	if err != nil {
		s.logger.Ctx(ctx).Error("Failed to marshal task definition", zap.Error(err))
		return nil, err
	}

	task := models.Task{
		Owner:          userID,
		TaskDefinition: taskJson,
		Status:         models.TaskStatusCreated,
	}

	if err := models.CreateTask(task); err != nil {
		s.logger.Ctx(ctx).Error("Failed to create task", zap.Error(err))
		return nil, err
	}

	return &task, nil
}

func (s *TaskService) UpdateTask(ctx context.Context, task models.TaskDefinition, userID string, taskID string) (*models.Task, error) {
	taskIDUint, err := strconv.ParseUint(taskID, 10, 64)
	if err != nil {
		s.logger.Ctx(ctx).Error("Failed to parse task id", zap.Error(err))
		return nil, err
	}

	existingTask, err := models.GetTaskById(taskIDUint)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			s.logger.Ctx(ctx).Error("Task not found", zap.Uint64("task_id", taskIDUint))
			return nil, fmt.Errorf("task not found")
		}
		s.logger.Ctx(ctx).Error("Error while getting task from db", zap.Error(err))
		return nil, err
	}

	taskJson, err := sonic.Marshal(task)
	if err != nil {
		s.logger.Ctx(ctx).Error("Failed to marshal task definition", zap.Error(err))
		return nil, err
	}

	existingTask.TaskDefinition = taskJson

	if err := models.UpdateTask(*existingTask); err != nil {
		s.logger.Ctx(ctx).Error("Failed to update task", zap.Error(err))
		return nil, err
	}

	return existingTask, nil
}
