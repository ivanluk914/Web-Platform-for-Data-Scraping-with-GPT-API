package services

import (
	"admin-api/models"
	"context"
	"errors"
	"fmt"
	"strconv"
	"time"

	"github.com/gocql/gocql"
	"github.com/uptrace/opentelemetry-go-extra/otelzap"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

type ArtifactRepository interface {
	InsertArtifact(artifact *models.TaskRunArtifact) error
	ListArtifactsByTaskRunID(airflowInstanceId gocql.UUID, limit int, offset int) ([]*models.TaskRunArtifact, error)
}

type TaskService struct {
	logger                    *otelzap.Logger
	taskRunArtifactRepository ArtifactRepository
}

func NewTaskService(logger *otelzap.Logger, taskRunMetadataRepository ArtifactRepository) *TaskService {
	return &TaskService{logger: logger, taskRunArtifactRepository: taskRunMetadataRepository}
}

func (s *TaskService) GetAllTasks(ctx context.Context) ([]models.TaskDto, error) {
	tasks, err := models.GetAllTasks(ctx)
	if err != nil {
		s.logger.Ctx(ctx).Error("Failed find tasks", zap.Error(err))
		return nil, err
	}

	taskDtos := []models.TaskDto{}
	for _, task := range tasks {
		taskDto, err := s.MapTaskToDto(ctx, &task)
		if err != nil {
			s.logger.Ctx(ctx).Error("Error while mapping task to dto", zap.Error(err))
			return nil, err
		}
		taskDtos = append(taskDtos, *taskDto)
	}
	return taskDtos, nil
}

func (s *TaskService) GetTasksByUserId(ctx context.Context, userId string) ([]models.TaskDto, error) {
	tasks, err := models.GetTasksByUserId(ctx, userId)
	if err != nil {
		s.logger.Ctx(ctx).Error("Failed find tasks", zap.Error(err))
		return nil, err
	}

	taskDtos := []models.TaskDto{}
	for _, task := range tasks {
		taskDto, err := s.MapTaskToDto(ctx, &task)
		if err != nil {
			s.logger.Ctx(ctx).Error("Error while mapping task to dto", zap.Error(err))
			return nil, err
		}
		taskDtos = append(taskDtos, *taskDto)
	}
	return taskDtos, nil
}

func (s *TaskService) GetTaskById(ctx context.Context, taskID string) (*models.TaskDto, error) {
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

	task, err := models.GetTaskById(ctx, taskIDUint)
	if err != nil {
		s.logger.Ctx(ctx).Error("Error while getting task from db", zap.Error(err))
		return nil, err
	}

	taskDto, err := s.MapTaskToDto(ctx, task)
	if err != nil {
		s.logger.Ctx(ctx).Error("Error while mapping task to dto", zap.Error(err))
		return nil, err
	}

	if err := models.SetTaskCache(ctx, taskDto); err != nil {
		s.logger.Ctx(ctx).Error("Error while setting task in cache", zap.Error(err))
		return nil, err
	}

	return taskDto, nil
}

func (s *TaskService) CreateTask(ctx context.Context, task models.Task, userID string) (*models.Task, error) {
	createTask := models.Task{
		Owner:          userID,
		TaskDefinition: task.TaskDefinition,
		TaskName:       task.TaskName,
		Status:         models.TaskStatusCreated,
	}

	createdTask, err := models.CreateTask(ctx, createTask)
	if err != nil {
		s.logger.Ctx(ctx).Error("Failed to create task", zap.Error(err))
		return nil, err
	}

	return createdTask, nil
}

func (s *TaskService) UpdateTask(ctx context.Context, task models.Task, userID string, taskID string) (*models.Task, error) {
	taskIDUint, err := strconv.ParseUint(taskID, 10, 64)
	if err != nil {
		s.logger.Ctx(ctx).Error("Failed to parse task id", zap.Error(err))
		return nil, err
	}

	existingTask, err := models.GetTaskById(ctx, taskIDUint)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			s.logger.Ctx(ctx).Error("Task not found", zap.Uint64("task_id", taskIDUint))
			return nil, fmt.Errorf("task not found")
		}
		s.logger.Ctx(ctx).Error("Error while getting task from db", zap.Error(err))
		return nil, err
	}

	existingTask.TaskDefinition = task.TaskDefinition
	existingTask.TaskName = task.TaskName
	existingTask.Status = task.Status
	existingTask.UpdatedAt = time.Now()

	updatedTask, err := models.UpdateTask(ctx, *existingTask)
	if err != nil {
		s.logger.Ctx(ctx).Error("Failed to update task", zap.Error(err))
		return nil, err
	}

	if err := models.ClearTaskCache(ctx, taskIDUint); err != nil {
		s.logger.Ctx(ctx).Error("Failed to clear task cache", zap.Error(err))
		return nil, err
	}

	return updatedTask, nil
}

func (s *TaskService) DeleteTask(ctx context.Context, taskID string) error {
	taskIDUint, err := strconv.ParseUint(taskID, 10, 64)
	if err != nil {
		s.logger.Ctx(ctx).Error("Failed to parse task id", zap.Error(err))
		return err
	}

	err = models.DeleteTask(ctx, taskIDUint)
	if err != nil {
		s.logger.Ctx(ctx).Error("Failed to delete task", zap.Error(err))
		return err
	}

	return nil
}

func (s *TaskService) ListTaskRuns(ctx context.Context, taskID string) ([]*models.TaskRunDto, error) {
	taskIDUint, err := strconv.ParseUint(taskID, 10, 64)
	if err != nil {
		s.logger.Ctx(ctx).Error("Failed to parse task id", zap.Error(err))
		return nil, err
	}

	taskRuns, err := models.ListRunsForTask(ctx, taskIDUint)
	if err != nil {
		s.logger.Ctx(ctx).Error("Error while getting task runs", zap.Error(err))
		return nil, err
	}

	taskRunsDto := []*models.TaskRunDto{}
	for _, taskRun := range taskRuns {
		taskRunsDto = append(taskRunsDto, s.MapTaskRunToDto(ctx, &taskRun))
	}

	return taskRunsDto, nil
}

func (s *TaskService) GetTaskRun(ctx context.Context, taskRunID string) (*models.TaskRunDto, error) {
	taskRunIDUint, err := strconv.ParseUint(taskRunID, 10, 64)
	if err != nil {
		s.logger.Ctx(ctx).Error("Failed to parse task id", zap.Error(err))
		return nil, err
	}

	taskRun, err := models.GetTaskRun(ctx, taskRunIDUint)
	if err != nil {
		s.logger.Ctx(ctx).Error("Error while getting task runs", zap.Error(err))
		return nil, err
	}

	taskRunDto := s.MapTaskRunToDto(ctx, taskRun)

	return taskRunDto, nil
}

func (s *TaskService) CreateTaskRun(ctx context.Context, taskRun models.TaskRun) (*models.TaskRun, error) {
	taskRun.Status = models.TaskStatusCreated
	createdTaskRun, err := models.CreateTaskRun(ctx, taskRun)
	if err != nil {
		s.logger.Ctx(ctx).Error("Error while creating task run", zap.Error(err))
		return nil, err
	}

	return createdTaskRun, nil
}

func (s *TaskService) UpdateTaskRun(ctx context.Context, taskRun models.TaskRun, taskRunID string) (*models.TaskRun, error) {
	taskRunIDUint, err := strconv.ParseUint(taskRunID, 10, 64)
	if err != nil {
		s.logger.Ctx(ctx).Error("Failed to parse task id", zap.Error(err))
		return nil, err
	}

	updatedTaskRun, err := models.UpdateTaskRun(ctx, taskRun, taskRunIDUint)
	if err != nil {
		s.logger.Ctx(ctx).Error("Error while creating task run", zap.Error(err))
		return nil, err
	}

	return updatedTaskRun, nil
}

func (s *TaskService) GetTaskRunArtifacts(ctx context.Context, taskRunID string, page int, pageSize int) ([]*models.TaskRunArtifactDto, error) {
	taskRunIDUint, err := strconv.ParseUint(taskRunID, 10, 64)
	if err != nil {
		s.logger.Ctx(ctx).Error("Failed to parse task id", zap.Error(err))
		return nil, err
	}

	taskRun, err := models.GetTaskRun(ctx, taskRunIDUint)
	if err != nil {
		s.logger.Ctx(ctx).Error("Error while getting task runs", zap.Error(err))
		return nil, err
	}

	airflowUUID, err := gocql.ParseUUID(taskRun.AirflowInstanceID)
	if err != nil {
		s.logger.Ctx(ctx).Error("Error parsing AirflowInstanceID to UUID", zap.Error(err))
		return nil, err
	}

	offset := (page - 1) * pageSize

	artifacts, err := s.taskRunArtifactRepository.ListArtifactsByTaskRunID(airflowUUID, pageSize, offset)
	if err != nil {
		s.logger.Ctx(ctx).Error("Error while getting task run metadata", zap.Error(err))
		return nil, err
	}

	artifactsDto := []*models.TaskRunArtifactDto{}
	for _, artifact := range artifacts {
		artifactsDto = append(artifactsDto, s.MapTaskRunArtifactToDto(ctx, artifact))
	}

	return artifactsDto, nil
}

func (s *TaskService) CreateTaskRunArtifact(ctx context.Context, artifact *models.CreateTaskRunArtifactDto) (*models.TaskRunArtifact, error) {
	taskRunArtifact, err := s.MapDtoToTaskRunArtifact(ctx, artifact)
	if err != nil {
		s.logger.Ctx(ctx).Error("Error while mapping task run artifact to dto", zap.Error(err))
		return nil, err
	}

	if err := s.taskRunArtifactRepository.InsertArtifact(taskRunArtifact); err != nil {
		s.logger.Ctx(ctx).Error("Error while inserting task run artifact", zap.Error(err))
		return nil, err
	}

	return taskRunArtifact, nil
}

func (s *TaskService) MapTaskToDto(ctx context.Context, task *models.Task) (*models.TaskDto, error) {
	// taskRun, err := models.GetLatestRunForTask(ctx, uint64(task.ID))
	// if err != nil {
	// 	s.logger.Ctx(ctx).Error("Error while getting task run from db", zap.Error(err))
	// 	return nil, err
	// }

	// status := models.TaskStatusPending
	// if taskRun != nil {
	// 	status = taskRun.Status
	// }

	taskDto := &models.TaskDto{
		ID:             strconv.FormatUint(uint64(task.ID), 10),
		TaskName:       task.TaskName,
		TaskDefinition: string(task.TaskDefinition),
		Status:         task.Status,
		Owner:          task.Owner,
		CreatedAt:      task.CreatedAt,
		UpdatedAt:      task.UpdatedAt,
		DeletedAt:      task.DeletedAt.Time,
	}

	return taskDto, nil
}

func (s *TaskService) MapTaskRunToDto(ctx context.Context, taskRun *models.TaskRun) *models.TaskRunDto {
	taskRunDto := &models.TaskRunDto{
		TaskID:       strconv.FormatUint(uint64(taskRun.TaskID), 10),
		Status:       taskRun.Status,
		StartTime:    taskRun.StartTime,
		EndTime:      taskRun.EndTime,
		ErrorMessage: taskRun.ErrorMessage,
	}
	return taskRunDto
}

func (s *TaskService) MapTaskRunArtifactToDto(ctx context.Context, artifact *models.TaskRunArtifact) *models.TaskRunArtifactDto {
	taskRunArtifactDto := &models.TaskRunArtifactDto{
		AirflowInstanceID: artifact.AirflowInstanceID.String(),
		AirflowTaskID:     artifact.AirflowTaskID.String(),
		ArtifactID:        artifact.ArtifactID.String(),
		CreatedAt:         artifact.CreatedAt,
		ArtifactType:      artifact.ArtifactType,
		URL:               artifact.URL,
		ContentType:       artifact.ContentType,
		ContentLength:     artifact.ContentLength,
		StatusCode:        artifact.StatusCode,
		AdditionalData:    artifact.AdditionalData,
	}
	return taskRunArtifactDto
}

func (s *TaskService) MapDtoToTaskRunArtifact(ctx context.Context, artifact *models.CreateTaskRunArtifactDto) (*models.TaskRunArtifact, error) {
	airflowInstanceID, err := gocql.ParseUUID(artifact.AirflowInstanceID)
	if err != nil {
		s.logger.Ctx(ctx).Error("Error parsing AirflowInstanceID to UUID", zap.Error(err))
		return nil, err
	}
	airflowTaskID, err := gocql.ParseUUID(artifact.AirflowTaskID)
	if err != nil {
		s.logger.Ctx(ctx).Error("Error parsing AirflowTaskID to UUID", zap.Error(err))
		return nil, err
	}
	artifactID, err := gocql.ParseUUID(artifact.ArtifactID)
	if err != nil {
		s.logger.Ctx(ctx).Error("Error parsing ArtifactID to UUID", zap.Error(err))
		return nil, err
	}

	taskRunArtifact := &models.TaskRunArtifact{
		AirflowInstanceID: airflowInstanceID,
		AirflowTaskID:     airflowTaskID,
		ArtifactID:        artifactID,
		CreatedAt:         artifact.CreatedAt,
		ArtifactType:      artifact.ArtifactType,
		URL:               artifact.URL,
		ContentType:       artifact.ContentType,
		ContentLength:     artifact.ContentLength,
		StatusCode:        artifact.StatusCode,
		AdditionalData:    artifact.AdditionalData,
	}
	return taskRunArtifact, nil
}
