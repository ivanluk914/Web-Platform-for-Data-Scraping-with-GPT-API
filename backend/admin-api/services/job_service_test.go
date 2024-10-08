package services

import (
	"admin-api/models"
	"context"
	"math/rand"
	"testing"

	"github.com/alicebob/miniredis/v2"
	"github.com/bytedance/sonic"
	"github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/zap"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)

	err = db.AutoMigrate(&models.Job{})
	require.NoError(t, err)

	models.SetDB(db)
	return db
}

func setupMiniRedis(t *testing.T) *miniredis.Miniredis {
	mr, err := miniredis.Run()
	require.NoError(t, err)

	client := redis.NewClient(&redis.Options{
		Addr: mr.Addr(),
	})

	if existingClient := models.GetRedis(); existingClient != nil {
		existingClient.Close()
	}

	models.SetRedis(client)

	return mr
}

func setupTestService(t *testing.T) (*JobService, *gorm.DB, *miniredis.Miniredis) {
	logger, _ := zap.NewDevelopment()
	service := NewJobService(logger)
	db := setupTestDB(t)
	mr := setupMiniRedis(t)
	return service, db, mr
}

func TestGetJobsByUserId(t *testing.T) {
	service, db, mr := setupTestService(t)
	defer mr.Close()
	ctx := context.Background()

	t.Run("Successful retrieval", func(t *testing.T) {
		userId := "user1"
		task1 := mockTaskDefinition()
		task2 := mockTaskDefinition()
		taskJSON1, _ := sonic.Marshal(task1)
		taskJSON2, _ := sonic.Marshal(task2)
		expectedJobs := []models.Job{
			{Owner: userId, TaskId: "task1", Status: models.JobStatusCreated, TaskDefinition: taskJSON1},
			{Owner: userId, TaskId: "task2", Status: models.JobStatusRunning, TaskDefinition: taskJSON2},
		}
		for _, job := range expectedJobs {
			require.NoError(t, db.Create(&job).Error)
		}

		jobs, err := service.GetJobsByUserId(ctx, userId)
		assert.NoError(t, err)
		assert.Len(t, jobs, 2)
		assert.Equal(t, expectedJobs[0].TaskId, jobs[0].TaskId)
		assert.Equal(t, expectedJobs[1].TaskId, jobs[1].TaskId)

		var taskFromJob1, taskFromJob2 models.TaskDefinition
		sonic.Unmarshal(jobs[0].TaskDefinition, &taskFromJob1)
		sonic.Unmarshal(jobs[1].TaskDefinition, &taskFromJob2)
		assert.Equal(t, task1, taskFromJob1)
		assert.Equal(t, task2, taskFromJob2)
	})

	t.Run("No jobs found", func(t *testing.T) {
		userId := "user2"
		jobs, err := service.GetJobsByUserId(ctx, userId)
		assert.NoError(t, err)
		assert.Len(t, jobs, 0)
	})
}

func TestGetJobById(t *testing.T) {
	service, db, mr := setupTestService(t)
	defer mr.Close()
	ctx := context.Background()

	t.Run("Successful retrieval", func(t *testing.T) {
		task := mockTaskDefinition()
		taskJSON, _ := sonic.Marshal(task)
		expectedJob := models.Job{Owner: "user1", TaskId: "task1", Status: models.JobStatusCreated, TaskDefinition: taskJSON}
		require.NoError(t, db.Create(&expectedJob).Error)

		job, err := service.GetJobById(ctx, "1")
		assert.NoError(t, err)
		assert.NotNil(t, job)
		assert.Equal(t, expectedJob.Owner, job.Owner)
		assert.Equal(t, expectedJob.TaskId, job.TaskId)

		var taskFromJob models.TaskDefinition
		sonic.Unmarshal(job.TaskDefinition, &taskFromJob)
		assert.Equal(t, task, taskFromJob)
	})

	t.Run("Job not found", func(t *testing.T) {
		job, err := service.GetJobById(ctx, "999")
		assert.Error(t, err)
		assert.Nil(t, job)
	})

	t.Run("Invalid job ID", func(t *testing.T) {
		job, err := service.GetJobById(ctx, "invalid")
		assert.Error(t, err)
		assert.Nil(t, job)
	})
}

func TestCreateJob(t *testing.T) {
	service, _, mr := setupTestService(t)
	defer mr.Close()
	ctx := context.Background()

	t.Run("Successful creation", func(t *testing.T) {
		task := mockTaskDefinition()
		userId := "user1"

		job, err := service.CreateJob(ctx, task, userId)
		assert.NoError(t, err)
		assert.NotNil(t, job)
		assert.Equal(t, userId, job.Owner)
		assert.Equal(t, models.JobStatusCreated, job.Status)

		var taskFromJob models.TaskDefinition
		err = sonic.Unmarshal(job.TaskDefinition, &taskFromJob)
		assert.NoError(t, err)
		assert.Equal(t, task, taskFromJob)
	})
}

func TestUpdateJob(t *testing.T) {
	service, db, mr := setupTestService(t)
	defer mr.Close()
	ctx := context.Background()

	t.Run("Successful update", func(t *testing.T) {
		initialTask := mockTaskDefinition()
		initialTaskJSON, _ := sonic.Marshal(initialTask)
		initialJob := models.Job{Owner: "user1", TaskId: "task1", Status: models.JobStatusCreated, TaskDefinition: initialTaskJSON}
		require.NoError(t, db.Create(&initialJob).Error)

		updatedTask := mockTaskDefinitionWithRandomPeriod()

		updatedJob, err := service.UpdateJob(ctx, updatedTask, "user1", "1")
		assert.NoError(t, err)
		assert.NotNil(t, updatedJob)
		assert.Equal(t, "user1", updatedJob.Owner)
		assert.Equal(t, models.JobStatusCreated, updatedJob.Status)

		var taskFromJob models.TaskDefinition
		err = sonic.Unmarshal(updatedJob.TaskDefinition, &taskFromJob)
		assert.NoError(t, err)
		assert.Equal(t, updatedTask, taskFromJob)
	})

	t.Run("Job not found", func(t *testing.T) {
		task := mockTaskDefinition()
		updatedJob, err := service.UpdateJob(ctx, task, "user1", "999")
		assert.Error(t, err)
		assert.Nil(t, updatedJob)
		assert.Contains(t, err.Error(), "job not found")
	})
}

// mockTaskDefinition generates a mock TaskDefinition for testing
func mockTaskDefinition() models.TaskDefinition {
	return models.TaskDefinition{
		Source: []models.UrlSource{
			{
				Type: models.SourceTypeUrl,
				URL:  "https://example.com",
			},
		},
		Target: []models.Target{
			{
				Type:  models.TargetTypeAuto,
				Value: "auto-target",
			},
			{
				Type:  models.TargetTypeXpath,
				Name:  "xpath-target",
				Value: "//div[@class='content']",
			},
		},
		Output: []models.Output{
			{
				Type: models.OutputTypeJson,
			},
			{
				Type:   models.OutputTypeGpt,
				Prompt: "Summarize the content",
			},
		},
		Period: models.JobPeriodDaily,
	}
}

// mockTaskDefinitionWithRandomPeriod generates a mock TaskDefinition with a random period
func mockTaskDefinitionWithRandomPeriod() models.TaskDefinition {
	task := mockTaskDefinition()
	periods := []models.JobPeriod{
		models.JobPeriodHourly,
		models.JobPeriodDaily,
		models.JobPeriodWeekly,
		models.JobPeriodMonthly,
	}
	task.Period = periods[rand.Intn(len(periods))]
	return task
}
