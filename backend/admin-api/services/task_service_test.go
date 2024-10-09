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

	err = db.AutoMigrate(&models.Task{})
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

func setupTestService(t *testing.T) (*TaskService, *gorm.DB, *miniredis.Miniredis) {
	logger, _ := zap.NewDevelopment()
	service := NewTaskService(logger)
	db := setupTestDB(t)
	mr := setupMiniRedis(t)
	return service, db, mr
}

func TestGetTasksByUserId(t *testing.T) {
	service, db, mr := setupTestService(t)
	defer mr.Close()
	ctx := context.Background()

	t.Run("Successful retrieval", func(t *testing.T) {
		userId := "user1"
		taskDefinition1 := mockTaskDefinition()
		taskDefinition2 := mockTaskDefinition()
		taskDefinitionJSON1, _ := sonic.Marshal(taskDefinition1)
		taskDefinitionJSON2, _ := sonic.Marshal(taskDefinition2)
		expectedTasks := []models.Task{
			{Owner: userId, TaskId: "task1", Status: models.TaskStatusCreated, TaskDefinition: taskDefinitionJSON1},
			{Owner: userId, TaskId: "task2", Status: models.TaskStatusRunning, TaskDefinition: taskDefinitionJSON2},
		}
		for _, task := range expectedTasks {
			require.NoError(t, db.Create(&task).Error)
		}

		tasks, err := service.GetTasksByUserId(ctx, userId)
		assert.NoError(t, err)
		assert.Len(t, tasks, 2)
		assert.Equal(t, expectedTasks[0].TaskId, tasks[0].TaskId)
		assert.Equal(t, expectedTasks[1].TaskId, tasks[1].TaskId)

		var updatedTaskDefinition1, updatedTaskDefinition2 models.TaskDefinition
		sonic.Unmarshal(tasks[0].TaskDefinition, &updatedTaskDefinition1)
		sonic.Unmarshal(tasks[1].TaskDefinition, &updatedTaskDefinition2)
		assert.Equal(t, taskDefinition1, updatedTaskDefinition1)
		assert.Equal(t, taskDefinition2, updatedTaskDefinition2)
	})

	t.Run("No tasks found", func(t *testing.T) {
		userId := "user2"
		tasks, err := service.GetTasksByUserId(ctx, userId)
		assert.NoError(t, err)
		assert.Len(t, tasks, 0)
	})
}

func TestGetTaskById(t *testing.T) {
	service, db, mr := setupTestService(t)
	defer mr.Close()
	ctx := context.Background()

	t.Run("Successful retrieval", func(t *testing.T) {
		taskDefinition := mockTaskDefinition()
		taskDefinitionJSON, _ := sonic.Marshal(taskDefinition)
		expectedTask := models.Task{Owner: "user1", TaskId: "task1", Status: models.TaskStatusCreated, TaskDefinition: taskDefinitionJSON}
		require.NoError(t, db.Create(&expectedTask).Error)

		task, err := service.GetTaskById(ctx, "1")
		assert.NoError(t, err)
		assert.NotNil(t, task)
		assert.Equal(t, expectedTask.Owner, task.Owner)
		assert.Equal(t, expectedTask.TaskId, task.TaskId)

		var updatedTaskDefinition models.TaskDefinition
		sonic.Unmarshal(task.TaskDefinition, &updatedTaskDefinition)
		assert.Equal(t, taskDefinition, updatedTaskDefinition)
	})

	t.Run("Task not found", func(t *testing.T) {
		task, err := service.GetTaskById(ctx, "999")
		assert.Error(t, err)
		assert.Nil(t, task)
	})

	t.Run("Invalid task ID", func(t *testing.T) {
		task, err := service.GetTaskById(ctx, "invalid")
		assert.Error(t, err)
		assert.Nil(t, task)
		assert.Contains(t, err.Error(), "invalid syntax")
	})
}

func TestCreateTask(t *testing.T) {
	service, _, mr := setupTestService(t)
	defer mr.Close()
	ctx := context.Background()

	t.Run("Successful creation", func(t *testing.T) {
		taskDefinition := mockTaskDefinition()
		userId := "user1"

		task, err := service.CreateTask(ctx, taskDefinition, userId)
		assert.NoError(t, err)
		assert.NotNil(t, task)
		assert.Equal(t, userId, task.Owner)
		assert.Equal(t, models.TaskStatusCreated, task.Status)

		var updatedTaskDefinition models.TaskDefinition
		err = sonic.Unmarshal(task.TaskDefinition, &updatedTaskDefinition)
		assert.NoError(t, err)
		assert.Equal(t, taskDefinition, updatedTaskDefinition)
	})
}

func TestUpdateTask(t *testing.T) {
	service, db, mr := setupTestService(t)
	defer mr.Close()
	ctx := context.Background()

	t.Run("Successful update", func(t *testing.T) {
		initialTaskDefinition := mockTaskDefinition()
		initialTaskDefinitionJSON, _ := sonic.Marshal(initialTaskDefinition)
		initialTask := models.Task{Owner: "user1", TaskId: "task1", Status: models.TaskStatusCreated, TaskDefinition: initialTaskDefinitionJSON}
		require.NoError(t, db.Create(&initialTask).Error)

		newTaskDefinition := mockTaskDefinitionWithRandomPeriod()

		updatedTask, err := service.UpdateTask(ctx, newTaskDefinition, "user1", "1")
		assert.NoError(t, err)
		assert.NotNil(t, updatedTask)
		assert.Equal(t, "user1", updatedTask.Owner)
		assert.Equal(t, models.TaskStatusCreated, updatedTask.Status)

		var updatedTaskDefinition models.TaskDefinition
		err = sonic.Unmarshal(updatedTask.TaskDefinition, &updatedTaskDefinition)
		assert.NoError(t, err)
		assert.Equal(t, updatedTaskDefinition, updatedTaskDefinition)
	})

	t.Run("Task not found", func(t *testing.T) {
		taskDefinition := mockTaskDefinition()
		updatedTask, err := service.UpdateTask(ctx, taskDefinition, "user1", "999")
		assert.Error(t, err)
		assert.Nil(t, updatedTask)
		assert.Contains(t, err.Error(), "task not found")
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
		Period: models.TaskPeriodDaily,
	}
}

// mockTaskDefinitionWithRandomPeriod generates a mock TaskDefinition with a random period
func mockTaskDefinitionWithRandomPeriod() models.TaskDefinition {
	task := mockTaskDefinition()
	periods := []models.TaskPeriod{
		models.TaskPeriodHourly,
		models.TaskPeriodDaily,
		models.TaskPeriodWeekly,
		models.TaskPeriodMonthly,
	}
	task.Period = periods[rand.Intn(len(periods))]
	return task
}
