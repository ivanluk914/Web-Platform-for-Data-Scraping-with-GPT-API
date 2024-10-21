package services

import (
	"admin-api/models"
	"context"
	"math/rand"
	"testing"
	"time"

	"github.com/alicebob/miniredis/v2"
	"github.com/bytedance/sonic"
	"github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/uptrace/opentelemetry-go-extra/otelzap"
	"go.uber.org/zap"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)

	err = db.AutoMigrate(&models.Task{}, &models.TaskRun{})
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
	taskRunArtifactRepo := &models.TaskRunArtifactRepository{}
	service := NewTaskService(otelzap.New(logger), taskRunArtifactRepo)
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
			{Owner: userId, TaskName: "Task 1", TaskDefinition: taskDefinitionJSON1},
			{Owner: userId, TaskName: "Task 2", TaskDefinition: taskDefinitionJSON2},
		}
		for _, task := range expectedTasks {
			require.NoError(t, db.Create(&task).Error)
		}

		tasks, err := service.GetTasksByUserId(ctx, userId)
		assert.NoError(t, err)
		assert.Len(t, tasks, 2)
		assert.Equal(t, expectedTasks[0].TaskName, tasks[0].TaskName)
		assert.Equal(t, expectedTasks[1].TaskName, tasks[1].TaskName)
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
		expectedTask := models.Task{Owner: "user1", TaskName: "Task 1", TaskDefinition: taskDefinitionJSON}
		require.NoError(t, db.Create(&expectedTask).Error)

		task, err := service.GetTaskById(ctx, "1")
		assert.NoError(t, err)
		assert.NotNil(t, task)
		assert.Equal(t, expectedTask.Owner, task.Owner)
		assert.Equal(t, expectedTask.TaskName, task.TaskName)
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
		taskDefinitionJSON, _ := sonic.Marshal(taskDefinition)
		userId := "user1"

		task := models.Task{
			Owner:          userId,
			TaskName:       "New Task",
			TaskDefinition: taskDefinitionJSON,
		}

		createdTask, err := service.CreateTask(ctx, task, userId)
		assert.NoError(t, err)
		assert.NotNil(t, createdTask)
		assert.Equal(t, userId, createdTask.Owner)
		assert.Equal(t, "New Task", createdTask.TaskName)
	})
}

func TestUpdateTask(t *testing.T) {
	service, db, mr := setupTestService(t)
	defer mr.Close()
	ctx := context.Background()

	t.Run("Successful update", func(t *testing.T) {
		initialTaskDefinition := mockTaskDefinition()
		initialTaskDefinitionJSON, _ := sonic.Marshal(initialTaskDefinition)
		initialTask := models.Task{Owner: "user1", TaskName: "Initial Task", TaskDefinition: initialTaskDefinitionJSON}
		require.NoError(t, db.Create(&initialTask).Error)

		newTaskDefinition := mockTaskDefinitionWithRandomPeriod()
		newTaskDefinitionJSON, _ := sonic.Marshal(newTaskDefinition)
		updatedTask := models.Task{
			TaskName:       "Updated Task",
			TaskDefinition: newTaskDefinitionJSON,
		}

		result, err := service.UpdateTask(ctx, updatedTask, "user1", "1")
		assert.NoError(t, err)
		assert.NotNil(t, result)
		assert.Equal(t, "user1", result.Owner)
		assert.Equal(t, "Updated Task", result.TaskName)
	})

	t.Run("Task not found", func(t *testing.T) {
		taskDefinition := mockTaskDefinition()
		taskDefinitionJSON, _ := sonic.Marshal(taskDefinition)
		updatedTask := models.Task{
			TaskName:       "Updated Task",
			TaskDefinition: taskDefinitionJSON,
		}
		result, err := service.UpdateTask(ctx, updatedTask, "user1", "999")
		assert.Error(t, err)
		assert.Nil(t, result)
		assert.Contains(t, err.Error(), "task not found")
	})
}

func TestListTaskRuns(t *testing.T) {
	service, db, mr := setupTestService(t)
	defer mr.Close()
	ctx := context.Background()

	t.Run("Successful retrieval", func(t *testing.T) {
		taskID := uint(1)
		expectedRuns := []models.TaskRun{
			{TaskID: taskID, Status: models.TaskStatusComplete, StartTime: time.Now(), EndTime: time.Now().Add(time.Hour)},
			{TaskID: taskID, Status: models.TaskStatusFailed, StartTime: time.Now().Add(-time.Hour), EndTime: time.Now()},
		}
		for _, run := range expectedRuns {
			require.NoError(t, db.Create(&run).Error)
		}

		runs, err := service.ListTaskRuns(ctx, "1")
		assert.NoError(t, err)
		assert.Len(t, runs, 2)
		assert.Equal(t, models.TaskStatusComplete, runs[0].Status)
		assert.Equal(t, models.TaskStatusFailed, runs[1].Status)
	})

	t.Run("No runs found", func(t *testing.T) {
		runs, err := service.ListTaskRuns(ctx, "999")
		assert.NoError(t, err)
		assert.Len(t, runs, 0)
	})
}

// mockTaskDefinition generates a mock TaskDefinition for testing
func mockTaskDefinition() models.TaskDefinition {
	return models.TaskDefinition{
		Type: models.TaskRunTypePreview,
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
				Type:  models.OutputTypeGpt,
				Value: "Summarize the content",
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
