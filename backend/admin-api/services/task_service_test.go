package services

import (
	"admin-api/models"
	"context"
	"errors"
	"math/rand"
	"strconv"
	"testing"
	"time"

	"github.com/alicebob/miniredis/v2"
	"github.com/bytedance/sonic"
	"github.com/gocql/gocql"
	"github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
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

func TestGetTaskRunArtifacts(t *testing.T) {
	service, _, mr := setupTestService(t)
	defer mr.Close()
	ctx := context.Background()

	mockRepo := &MockTaskRunArtifactRepository{}
	service.taskRunArtifactRepository = mockRepo

	t.Run("Successful retrieval", func(t *testing.T) {
		taskRun := models.TaskRun{
			TaskID:            1,
			AirflowInstanceID: gocql.UUIDFromTime(time.Now()).String(),
			Status:            models.TaskStatusComplete,
			StartTime:         time.Now(),
			EndTime:           time.Now().Add(time.Hour),
			ErrorMessage:      "",
		}

		page := 1
		pageSize := 10
		expectedArtifacts := []*models.TaskRunArtifact{
			{AirflowInstanceID: gocql.UUIDFromTime(time.Now()), ArtifactID: gocql.UUIDFromTime(time.Now())},
			{AirflowInstanceID: gocql.UUIDFromTime(time.Now()), ArtifactID: gocql.UUIDFromTime(time.Now())},
		}
		mockRepo.On("ListArtifactsByTaskRunID", mock.Anything, pageSize, (page-1)*pageSize).Return(expectedArtifacts, nil)

		createdTaskRun, err1 := service.CreateTaskRun(ctx, taskRun)

		artifacts, err2 := service.GetTaskRunArtifacts(ctx, strconv.FormatUint(uint64(createdTaskRun.ID), 10), page, pageSize)
		assert.NoError(t, err1)
		assert.NoError(t, err2)
		assert.Len(t, artifacts, 2)
		assert.Equal(t, expectedArtifacts[0].ArtifactID.String(), artifacts[0].ArtifactID)
		assert.Equal(t, expectedArtifacts[1].ArtifactID.String(), artifacts[1].ArtifactID)

		mockRepo.AssertExpectations(t)
	})

	t.Run("Error retrieval", func(t *testing.T) {
		taskRunID := "456"
		page := 1
		pageSize := 10

		mockRepo.On("ListArtifactsByTaskRunID", mock.Anything, pageSize, (page-1)*pageSize).Return(nil, errors.New("database error"))

		artifacts, err := service.GetTaskRunArtifacts(ctx, taskRunID, page, pageSize)
		assert.Error(t, err)
		assert.Nil(t, artifacts)

		mockRepo.AssertExpectations(t)
	})
}

func TestCreateTaskRunArtifact(t *testing.T) {
	service, _, mr := setupTestService(t)
	defer mr.Close()
	ctx := context.Background()

	mockRepo := &MockTaskRunArtifactRepository{}
	service.taskRunArtifactRepository = mockRepo

	t.Run("Successful creation", func(t *testing.T) {
		artifact := &models.CreateTaskRunArtifactDto{
			AirflowInstanceID: gocql.UUIDFromTime(time.Now()).String(),
			AirflowTaskID:     gocql.UUIDFromTime(time.Now()).String(),
			ArtifactID:        gocql.UUIDFromTime(time.Now()).String(),
			CreatedAt:         time.Now(),
			ArtifactType:      "output",
			URL:               "https://example.com/artifact",
		}

		mockRepo.On("InsertArtifact", mock.AnythingOfType("*models.TaskRunArtifact")).Return(nil)

		createdArtifact, err := service.CreateTaskRunArtifact(ctx, artifact)
		assert.NoError(t, err)
		assert.NotNil(t, createdArtifact)
		assert.Equal(t, artifact.AirflowInstanceID, createdArtifact.AirflowInstanceID.String())
		assert.Equal(t, artifact.AirflowTaskID, createdArtifact.AirflowTaskID.String())
		assert.Equal(t, artifact.ArtifactType, createdArtifact.ArtifactType)
		assert.Equal(t, artifact.URL, createdArtifact.URL)

		mockRepo.AssertExpectations(t)
	})

	t.Run("Error creation", func(t *testing.T) {
		artifact := &models.CreateTaskRunArtifactDto{
			AirflowInstanceID: "instance2",
			AirflowTaskID:     "task2",
			ArtifactType:      "log",
			URL:               "https://example.com/log",
		}

		mockRepo.On("InsertArtifact", mock.AnythingOfType("*models.TaskRunArtifact")).Return(errors.New("database error"))

		createdArtifact, err := service.CreateTaskRunArtifact(ctx, artifact)
		assert.Error(t, err)
		assert.Nil(t, createdArtifact)

		mockRepo.AssertExpectations(t)
	})
}

func TestGetTaskRun(t *testing.T) {
	service, db, mr := setupTestService(t)
	defer mr.Close()
	ctx := context.Background()

	t.Run("Successful retrieval", func(t *testing.T) {
		taskRun := models.TaskRun{
			TaskID:            1,
			Status:            models.TaskStatusComplete,
			StartTime:         time.Now(),
			EndTime:           time.Now().Add(time.Hour),
			ErrorMessage:      "",
			AirflowInstanceID: gocql.UUIDFromTime(time.Now()).String(),
		}
		require.NoError(t, db.Create(&taskRun).Error)

		retrievedTaskRun, err := service.GetTaskRun(ctx, strconv.FormatUint(uint64(taskRun.ID), 10))
		assert.NoError(t, err)
		assert.NotNil(t, retrievedTaskRun)
		assert.Equal(t, strconv.FormatUint(uint64(taskRun.TaskID), 10), retrievedTaskRun.TaskID)
		assert.Equal(t, taskRun.Status, retrievedTaskRun.Status)
	})

	t.Run("TaskRun not found", func(t *testing.T) {
		nonExistentID := "999"
		retrievedTaskRun, err := service.GetTaskRun(ctx, nonExistentID)
		assert.Error(t, err)
		assert.Nil(t, retrievedTaskRun)
	})

	t.Run("Invalid TaskRun ID", func(t *testing.T) {
		invalidID := "invalid"
		retrievedTaskRun, err := service.GetTaskRun(ctx, invalidID)
		assert.Error(t, err)
		assert.Nil(t, retrievedTaskRun)
		assert.Contains(t, err.Error(), "invalid syntax")
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

	task.Period = periods[rand.Int63n(int64(len(periods)))]
	return task
}

// MockTaskRunArtifactRepository is a mock implementation of the TaskRunArtifactRepository
type MockTaskRunArtifactRepository struct {
	mock.Mock
}

func (m *MockTaskRunArtifactRepository) ListArtifactsByTaskRunID(airflowInstanceID gocql.UUID, limit int, offset int) ([]*models.TaskRunArtifact, error) {
	args := m.Called(airflowInstanceID, limit, offset)
	return args.Get(0).([]*models.TaskRunArtifact), args.Error(1)
}

func (m *MockTaskRunArtifactRepository) InsertArtifact(artifact *models.TaskRunArtifact) error {
	args := m.Called(artifact)
	return args.Error(0)
}

func TestGetAllTasks(t *testing.T) {
	service, db, mr := setupTestService(t)
	defer mr.Close()
	ctx := context.Background()

	t.Run("No tasks found", func(t *testing.T) {
		tasks, err := service.GetAllTasks(ctx)
		assert.NoError(t, err)
		assert.Len(t, tasks, 0)
	})

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

		tasks, err := service.GetAllTasks(ctx)
		assert.NoError(t, err)
		assert.Len(t, tasks, 2)
		assert.Equal(t, expectedTasks[0].TaskName, tasks[0].TaskName)
		assert.Equal(t, expectedTasks[1].TaskName, tasks[1].TaskName)
	})
}
