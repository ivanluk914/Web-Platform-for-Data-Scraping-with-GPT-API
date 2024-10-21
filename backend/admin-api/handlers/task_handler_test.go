package handlers

import (
	"admin-api/models"
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/bytedance/sonic"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

type MockTaskService struct {
	mock.Mock
}

func (m *MockTaskService) GetTasksByUserId(ctx context.Context, userId string) ([]models.TaskDto, error) {
	args := m.Called(ctx, userId)
	return args.Get(0).([]models.TaskDto), args.Error(1)
}

func (m *MockTaskService) GetTaskById(ctx context.Context, taskID string) (*models.TaskDto, error) {
	args := m.Called(ctx, taskID)
	return args.Get(0).(*models.TaskDto), args.Error(1)
}

func (m *MockTaskService) CreateTask(ctx context.Context, task models.Task, userID string) (*models.Task, error) {
	args := m.Called(ctx, task, userID)
	return args.Get(0).(*models.Task), args.Error(1)
}

func (m *MockTaskService) UpdateTask(ctx context.Context, task models.Task, userID string, taskID string) (*models.Task, error) {
	args := m.Called(ctx, task, userID, taskID)
	return args.Get(0).(*models.Task), args.Error(1)
}

func (m *MockTaskService) ListTaskRuns(ctx context.Context, taskID string) ([]*models.TaskRunDto, error) {
	args := m.Called(ctx, taskID)
	return args.Get(0).([]*models.TaskRunDto), args.Error(1)
}

func (m *MockTaskService) GetTaskRunArtifacts(ctx context.Context, taskRunID string, page int, pageSize int) ([]*models.TaskRunArtifactDto, error) {
	args := m.Called(ctx, taskRunID, page, pageSize)
	return args.Get(0).([]*models.TaskRunArtifactDto), args.Error(1)
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

	t.Run("Successful retrieval", func(t *testing.T) {
		mockTasks := []models.TaskDto{{ID: "1", Owner: "user1"}, {ID: "2", Owner: "user1"}}
		mockService.On("GetTasksByUserId", mock.Anything, "user1").Return(mockTasks, nil).Once()

		req, _ := http.NewRequest("GET", "/user/user1/task", nil)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		var response []models.TaskDto
		err := sonic.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, mockTasks, response)
	})

	t.Run("Error retrieval", func(t *testing.T) {
		mockService.On("GetTasksByUserId", mock.Anything, "user2").Return([]models.TaskDto{}, errors.New("database error")).Once()

		req, _ := http.NewRequest("GET", "/user/user2/task", nil)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})
}

func TestGetTask(t *testing.T) {
	r, mockService := setupTestRouter()

	t.Run("Successful retrieval", func(t *testing.T) {
		mockTask := &models.TaskDto{ID: "1", Owner: "user1"}
		mockService.On("GetTaskById", mock.Anything, "1").Return(mockTask, nil).Once()

		req, _ := http.NewRequest("GET", "/user/user1/task/1", nil)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		var response models.TaskDto
		err := sonic.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, mockTask, &response)
	})

	t.Run("Error retrieval", func(t *testing.T) {
		mockService.On("GetTaskById", mock.Anything, "2").Return((*models.TaskDto)(nil), errors.New("task not found")).Once()

		req, _ := http.NewRequest("GET", "/user/user1/task/2", nil)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})
}

func TestCreateTask(t *testing.T) {
	r, mockService := setupTestRouter()

	t.Run("Successful creation", func(t *testing.T) {
		task := models.Task{Owner: "user1", TaskName: "New Task", TaskDefinition: json.RawMessage(`{}`)}
		mockService.On("CreateTask", mock.Anything, task, "user1").Return(&task, nil).Once()

		taskJSON, _ := sonic.Marshal(task)
		req, _ := http.NewRequest("POST", "/user/user1/task", bytes.NewBuffer(taskJSON))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusCreated, w.Code)
		var response models.Task
		err := sonic.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, task, response)
	})

	t.Run("Invalid JSON", func(t *testing.T) {
		req, _ := http.NewRequest("POST", "/user/user1/task", bytes.NewBufferString("invalid json"))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})
}

func TestUpdateTask(t *testing.T) {
	r, mockService := setupTestRouter()

	t.Run("Successful update", func(t *testing.T) {
		task := models.Task{Owner: "user1", TaskName: "Updated Task"}
		mockService.On("UpdateTask", mock.Anything, mock.AnythingOfType("models.Task"), "user1", "1").
			Run(func(args mock.Arguments) {
				// Verify that the task passed to the service has the correct ID
				passedTaskID := args.Get(3).(string)
				assert.Equal(t, "1", passedTaskID)
			}).
			Return(&task, nil).Once()

		taskJSON, _ := sonic.Marshal(task)
		req, _ := http.NewRequest("PUT", "/user/user1/task/1", bytes.NewBuffer(taskJSON))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		var response models.Task
		err := sonic.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, task.ID, response.ID)
		assert.Equal(t, task.Owner, response.Owner)
		assert.Equal(t, task.TaskName, response.TaskName)
	})

	t.Run("Invalid JSON", func(t *testing.T) {
		req, _ := http.NewRequest("PUT", "/user/user1/task/1", bytes.NewBufferString("invalid json"))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})
}

func TestListTaskRuns(t *testing.T) {
	r, mockService := setupTestRouter()

	t.Run("Successful retrieval", func(t *testing.T) {
		mockTaskRuns := []*models.TaskRunDto{{TaskID: "1"}, {TaskID: "1"}}
		mockService.On("ListTaskRuns", mock.Anything, "1").Return(mockTaskRuns, nil).Once()

		req, _ := http.NewRequest("GET", "/user/user1/task/1/run", nil)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		var response []*models.TaskRunDto
		err := sonic.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, mockTaskRuns, response)
	})

	t.Run("Error retrieval", func(t *testing.T) {
		mockService.On("ListTaskRuns", mock.Anything, "2").Return([]*models.TaskRunDto{}, errors.New("database error")).Once()

		req, _ := http.NewRequest("GET", "/user/user1/task/2/run", nil)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})
}

func TestGetTaskRunArtifacts(t *testing.T) {
	r, mockService := setupTestRouter()

	t.Run("Successful retrieval", func(t *testing.T) {
		mockArtifacts := []*models.TaskRunArtifactDto{{AirflowInstanceID: "1", AirflowTaskID: "1"}, {AirflowInstanceID: "2", AirflowTaskID: "1"}}
		mockService.On("GetTaskRunArtifacts", mock.Anything, "1", 1, 10).Return(mockArtifacts, nil).Once()

		req, _ := http.NewRequest("GET", "/user/user1/task/1/run/1/artifact?page=1&pageSize=10", nil)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		var response []*models.TaskRunArtifactDto
		err := sonic.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, mockArtifacts, response)
	})

	t.Run("Invalid page number", func(t *testing.T) {
		req, _ := http.NewRequest("GET", "/user/user1/task/1/run/1/artifact?page=invalid", nil)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("Invalid page size", func(t *testing.T) {
		req, _ := http.NewRequest("GET", "/user/user1/task/1/run/1/artifact?pageSize=invalid", nil)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("Error retrieval", func(t *testing.T) {
		mockService.On("GetTaskRunArtifacts", mock.Anything, "2", 1, 10).Return([]*models.TaskRunArtifactDto{}, errors.New("database error")).Once()

		req, _ := http.NewRequest("GET", "/user/user1/task/1/run/2/artifact?page=1&pageSize=10", nil)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})
}
