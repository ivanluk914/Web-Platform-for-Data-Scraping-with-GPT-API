package services

import (
	"admin-api/models"
	"context"
	"errors"
	"fmt"
	"strconv"

	"github.com/bytedance/sonic"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

type JobService struct {
	logger *zap.Logger
}

func NewJobService(logger *zap.Logger) *JobService {
	return &JobService{logger: logger}
}

func (s *JobService) GetJobsByUserId(ctx context.Context, userId string) ([]models.Job, error) {
	jobs, err := models.GetJobsByUserId(userId)
	if err != nil {
		s.logger.Error("Failed find jobs", zap.Error(err))
		return nil, err
	}
	return jobs, nil
}

func (s *JobService) GetJobById(ctx context.Context, jobID string) (*models.Job, error) {
	jid, err := strconv.ParseUint(jobID, 10, 64)
	if err != nil {
		s.logger.Error("Failed to parse job id", zap.Error(err))
		return nil, err
	}

	j, err := models.GetJobFromCache(ctx, jid)
	if err != nil {
		s.logger.Error("Error while getting job from cache", zap.Error(err))
		return nil, err
	}
	if j != nil {
		return j, nil
	}

	job, err := models.GetJobById(jid)
	if err != nil {
		s.logger.Error("Error while getting job from db", zap.Error(err))
		return nil, err
	}

	if err := models.SetJobCache(ctx, job); err != nil {
		s.logger.Error("Error while setting job in cache", zap.Error(err))
		return nil, err
	}

	return job, nil
}

func (s *JobService) CreateJob(ctx context.Context, task models.TaskDefinition, userID string) (*models.Job, error) {
	taskJson, err := sonic.Marshal(task)
	if err != nil {
		s.logger.Error("Failed to marshal task definition", zap.Error(err))
		return nil, err
	}

	job := models.Job{
		Owner:          userID,
		TaskDefinition: taskJson,
		Status:         models.JobStatusCreated,
	}

	if err := models.CreateJob(job); err != nil {
		s.logger.Error("Failed to create job", zap.Error(err))
		return nil, err
	}

	return &job, nil
}

func (s *JobService) UpdateJob(ctx context.Context, task models.TaskDefinition, userID string, jobID string) (*models.Job, error) {
	jid, err := strconv.ParseUint(jobID, 10, 64)
	if err != nil {
		s.logger.Error("Failed to parse job id", zap.Error(err))
		return nil, err
	}

	existingJob, err := models.GetJobById(jid)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			s.logger.Error("Job not found", zap.Uint64("job_id", jid))
			return nil, fmt.Errorf("job not found")
		}
		s.logger.Error("Error while getting job from db", zap.Error(err))
		return nil, err
	}

	taskJson, err := sonic.Marshal(task)
	if err != nil {
		s.logger.Error("Failed to marshal task definition", zap.Error(err))
		return nil, err
	}

	existingJob.TaskDefinition = taskJson

	if err := models.UpdateJob(*existingJob); err != nil {
		s.logger.Error("Failed to update job", zap.Error(err))
		return nil, err
	}

	return existingJob, nil
}
