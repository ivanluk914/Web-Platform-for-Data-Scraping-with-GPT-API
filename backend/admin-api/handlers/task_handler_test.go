package handlers

import (
	"bytes"
	"context"
	"fmt"
	"math/rand"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/bytedance/sonic"
	"github.com/bytedance/sonic/decoder"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"

	"admin-api/models"
)

// MockTaskService is a mock implementation of the task service
type MockTaskService struct {
	mock.Mock
}

func (m *MockTaskService) GetTasksByUserId(ctx context.Context, userId string) ([]models.Task, error) {
	args := m.Called(ctx, userId)
	return args.Get(0).([]models.Task), args.Error(1)
}

func (m *MockTaskService) GetTaskById(ctx context.Context, taskId string) (*models.Task, error) {
	args := m.Called(ctx, taskId)
	return args.Get(0).(*models.Task), args.Error(1)
}

func (m *MockTaskService) CreateTask(ctx context.Context, task models.TaskDefinition, userID string) (*models.Task, error) {
	args := m.Called(ctx, task, userID)
	return args.Get(0).(*models.Task), args.Error(1)
}

func (m *MockTaskService) UpdateTask(ctx context.Context, task models.TaskDefinition, userID string, taskID string) (*models.Task, error) {
	args := m.Called(ctx, task, userID, taskID)
	return args.Get(0).(*models.Task), args.Error(1)
}

func setupTestRouter() (*gin.Engine, *MockTaskService) {
	gin.SetMode(gin.TestMode)
	r := gin.Default()
	mockService := new(MockTaskService)
	SetupTaskRoutes(r.Group("/"), mockService)
	return r, mockService
}

func TestGetTasks(t *testing.T) {
	r, mockService := setupTestRouter()
	server := httptest.NewServer(r)
	defer server.Close()

	t.Run("Successful retrieval", func(t *testing.T) {
		task1 := mockTaskDefinition()
		taskJSON1, _ := sonic.Marshal(task1)
		task2 := mockTaskDefinition()
		taskJSON2, _ := sonic.Marshal(task2)
		mockTasks := []models.Task{
			{Owner: "user1", TaskId: "task1", Status: models.TaskStatusCreated, TaskDefinition: taskJSON1},
			{Owner: "user1", TaskId: "task2", Status: models.TaskStatusFailed, TaskDefinition: taskJSON2},
		}
		mockService.On("GetTasksByUserId", mock.Anything, "user1").Return(mockTasks, nil).Once()

		resp, err := http.Get(fmt.Sprintf("%s/user/user1/task", server.URL))
		assert.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		var response []models.Task
		err = decoder.NewStreamDecoder(resp.Body).Decode(&response)
		assert.NoError(t, err)
		assert.Equal(t, mockTasks, response)
	})
}

func TestGetTask(t *testing.T) {
	r, mockService := setupTestRouter()
	server := httptest.NewServer(r)
	defer server.Close()

	t.Run("Successful retrieval", func(t *testing.T) {
		task := mockTaskDefinition()
		taskJSON, _ := sonic.Marshal(task)
		mockTask := &models.Task{Owner: "user1", TaskId: "task1", Status: models.TaskStatusCreated, TaskDefinition: taskJSON}
		mockService.On("GetTaskById", mock.Anything, "1").Return(mockTask, nil).Once()

		resp, err := http.Get(fmt.Sprintf("%s/user/user1/task/1", server.URL))
		assert.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		var response models.Task
		err = decoder.NewStreamDecoder(resp.Body).Decode(&response)
		assert.NoError(t, err)
		assert.Equal(t, mockTask, &response)
	})
}

func TestCreateTask(t *testing.T) {
	r, mockService := setupTestRouter()
	server := httptest.NewServer(r)
	defer server.Close()

	t.Run("Successful creation", func(t *testing.T) {
		task := mockTaskDefinition()
		taskJSON, _ := sonic.Marshal(task)
		mockTask := &models.Task{Owner: "user1", TaskId: "task1", Status: models.TaskStatusCreated, TaskDefinition: taskJSON}
		mockService.On("CreateTask", mock.Anything, task, "user1").Return(mockTask, nil).Once()

		resp, err := http.Post(fmt.Sprintf("%s/user/user1/task", server.URL), "application/json", bytes.NewBuffer(taskJSON))
		assert.NoError(t, err)
		assert.Equal(t, http.StatusCreated, resp.StatusCode)

		var response models.Task
		err = decoder.NewStreamDecoder(resp.Body).Decode(&response)
		assert.NoError(t, err)
		assert.Equal(t, mockTask, &response)
	})
}

func TestUpdateTask(t *testing.T) {
	r, mockService := setupTestRouter()
	server := httptest.NewServer(r)
	defer server.Close()

	t.Run("Successful update", func(t *testing.T) {
		task := mockTaskDefinitionWithRandomPeriod()
		taskJSON, _ := sonic.Marshal(task)
		mockTask := &models.Task{Owner: "user1", TaskId: "task1", Status: models.TaskStatusRunning, TaskDefinition: taskJSON}
		mockService.On("UpdateTask", mock.Anything, task, "user1", "1").Return(mockTask, nil).Once()

		req, _ := http.NewRequest(http.MethodPut, fmt.Sprintf("%s/user/user1/task/1", server.URL), bytes.NewBuffer(taskJSON))
		req.Header.Set("Content-Type", "application/json")
		resp, err := http.DefaultClient.Do(req)
		assert.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		var response models.Task
		err = decoder.NewStreamDecoder(resp.Body).Decode(&response)
		assert.NoError(t, err)
		assert.Equal(t, mockTask, &response)
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
