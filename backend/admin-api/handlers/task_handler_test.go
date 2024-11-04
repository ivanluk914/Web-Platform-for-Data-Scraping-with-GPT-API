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
	"time"

	"github.com/bytedance/sonic"
	"github.com/gin-gonic/gin"
	"github.com/gocql/gocql"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

type MockTaskService struct {
	mock.Mock
}

func (m *MockTaskService) GetAllTasks(ctx context.Context) ([]models.TaskDto, error) {
	args := m.Called(ctx)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]models.TaskDto), args.Error(1)
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

func (m *MockTaskService) DeleteTask(ctx context.Context, taskID string) error {
	args := m.Called(ctx, taskID)
	return args.Error(0)
}

func (m *MockTaskService) ListTaskRuns(ctx context.Context, taskID string) ([]*models.TaskRunDto, error) {
	args := m.Called(ctx, taskID)
	return args.Get(0).([]*models.TaskRunDto), args.Error(1)
}

func (m *MockTaskService) GetTaskRunArtifacts(ctx context.Context, taskRunID string, page int, pageSize int) ([]*models.TaskRunArtifactDto, error) {
	args := m.Called(ctx, taskRunID, page, pageSize)
	return args.Get(0).([]*models.TaskRunArtifactDto), args.Error(1)
}

func (m *MockTaskService) CreateTaskRun(ctx context.Context, taskRun models.TaskRun) (*models.TaskRun, error) {
	args := m.Called(ctx, taskRun)
	return args.Get(0).(*models.TaskRun), args.Error(1)
}

func (m *MockTaskService) UpdateTaskRun(ctx context.Context, taskRun models.TaskRun, taskRunID string) (*models.TaskRun, error) {
	args := m.Called(ctx, taskRun, taskRunID)
	return args.Get(0).(*models.TaskRun), args.Error(1)
}

func (m *MockTaskService) CreateTaskRunArtifact(ctx context.Context, artifact *models.CreateTaskRunArtifactDto) (*models.TaskRunArtifact, error) {
	args := m.Called(ctx, artifact)
	return args.Get(0).(*models.TaskRunArtifact), args.Error(1)
}

// Add this method to the MockTaskService
func (m *MockTaskService) GetTaskRun(ctx context.Context, taskRunID string) (*models.TaskRunDto, error) {
	args := m.Called(ctx, taskRunID)
	return args.Get(0).(*models.TaskRunDto), args.Error(1)
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

func TestCreateTaskRun(t *testing.T) {
	r, mockService := setupTestRouter()

	t.Run("Successful creation", func(t *testing.T) {
		taskRun := models.TaskRun{TaskID: uint(1), Status: models.TaskStatusComplete}
		mockService.On("CreateTaskRun", mock.Anything, taskRun).Return(&taskRun, nil).Once()

		taskRunJSON, _ := sonic.Marshal(taskRun)
		req, _ := http.NewRequest("POST", "/user/user1/task/1/run", bytes.NewBuffer(taskRunJSON))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		var response models.TaskRun
		err := sonic.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, taskRun, response)
	})

	t.Run("Invalid JSON", func(t *testing.T) {
		req, _ := http.NewRequest("POST", "/user/user1/task/1/run", bytes.NewBufferString("invalid json"))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("Service error", func(t *testing.T) {
		taskRun := models.TaskRun{TaskID: uint(1), Status: models.TaskStatusComplete}
		mockService.On("CreateTaskRun", mock.Anything, taskRun).Return((*models.TaskRun)(nil), errors.New("service error")).Once()

		taskRunJSON, _ := sonic.Marshal(taskRun)
		req, _ := http.NewRequest("POST", "/user/user1/task/1/run", bytes.NewBuffer(taskRunJSON))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})
}

func TestUpdateTaskRun(t *testing.T) {
	r, mockService := setupTestRouter()

	t.Run("Successful update", func(t *testing.T) {
		taskRun := models.TaskRun{TaskID: uint(1), Status: models.TaskStatusComplete}
		mockService.On("UpdateTaskRun", mock.Anything, taskRun).Return(&taskRun, nil).Once()

		taskRunJSON, _ := sonic.Marshal(taskRun)
		req, _ := http.NewRequest("PUT", "/user/user1/task/1/run/1", bytes.NewBuffer(taskRunJSON))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		var response models.TaskRun
		err := sonic.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, taskRun, response)
	})

	t.Run("Invalid JSON", func(t *testing.T) {
		req, _ := http.NewRequest("PUT", "/user/user1/task/1/run/1", bytes.NewBufferString("invalid json"))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("Service error", func(t *testing.T) {
		taskRun := models.TaskRun{TaskID: uint(1), Status: models.TaskStatusComplete}
		mockService.On("UpdateTaskRun", mock.Anything, taskRun).Return((*models.TaskRun)(nil), errors.New("service error")).Once()

		taskRunJSON, _ := sonic.Marshal(taskRun)
		req, _ := http.NewRequest("PUT", "/user/user1/task/1/run/1", bytes.NewBuffer(taskRunJSON))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})
}

func TestCreateTaskRunArtifact(t *testing.T) {
	r, mockService := setupTestRouter()

	t.Run("Successful creation", func(t *testing.T) {
		now := time.Now()
		artifact := &models.CreateTaskRunArtifactDto{AirflowInstanceID: gocql.UUIDFromTime(now).String(), AirflowTaskID: "1", ArtifactType: "output", URL: "test.txt"}
		createdArtifact := &models.TaskRunArtifact{AirflowInstanceID: gocql.UUIDFromTime(now), AirflowTaskID: gocql.UUIDFromTime(now), ArtifactType: "output", URL: "test.txt"}
		mockService.On("CreateTaskRunArtifact", mock.Anything, artifact).Return(createdArtifact, nil).Once()

		artifactJSON, _ := sonic.Marshal(artifact)
		req, _ := http.NewRequest("POST", "/user/user1/task/1/run/1/artifact", bytes.NewBuffer(artifactJSON))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		var response models.TaskRunArtifact
		err := sonic.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, *createdArtifact, response)
	})
}

func TestGetTaskRun(t *testing.T) {
	r, mockService := setupTestRouter()

	t.Run("Successful retrieval", func(t *testing.T) {
		mockTaskRun := &models.TaskRunDto{TaskID: "task1"}
		mockService.On("GetTaskRun", mock.Anything, "1").Return(mockTaskRun, nil).Once()

		req, _ := http.NewRequest("GET", "/user/user1/task/task1/run/1", nil)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		var response models.TaskRunDto
		err := sonic.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, mockTaskRun, &response)
	})

	t.Run("Error retrieval", func(t *testing.T) {
		mockService.On("GetTaskRun", mock.Anything, "2").Return((*models.TaskRunDto)(nil), errors.New("task run not found")).Once()

		req, _ := http.NewRequest("GET", "/user/user1/task/task1/run/2", nil)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})
}

func TestDeleteTask(t *testing.T) {
	gin.SetMode(gin.TestMode)

	tests := []struct {
		name           string
		taskID         string
		setupMock      func(*MockTaskService)
		expectedStatus int
		expectedBody   string
	}{
		{
			name:   "Successful deletion",
			taskID: "123",
			setupMock: func(m *MockTaskService) {
				m.On("DeleteTask", mock.Anything, "123").Return(nil)
			},
			expectedStatus: http.StatusOK,
			expectedBody:   "",
		},
		{
			name:   "Task not found",
			taskID: "456",
			setupMock: func(m *MockTaskService) {
				m.On("DeleteTask", mock.Anything, "456").Return(errors.New("task not found"))
			},
			expectedStatus: http.StatusInternalServerError,
			expectedBody:   `{"error":"task not found"}`,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockService := new(MockTaskService)
			tt.setupMock(mockService)

			handler := &TaskHandler{service: mockService}

			router := gin.New()
			router.DELETE("/user/:userId/task/:taskId", handler.DeleteTask)

			w := httptest.NewRecorder()
			req, _ := http.NewRequest("DELETE", "/user/123/task/"+tt.taskID, nil)
			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedStatus, w.Code)
			assert.Equal(t, tt.expectedBody, w.Body.String())

			mockService.AssertExpectations(t)
		})
	}
}

func TestGetAllTasks(t *testing.T) {
	gin.SetMode(gin.TestMode)

	tests := []struct {
		name           string
		setupMock      func(*MockTaskService)
		expectedStatus int
		expectedBody   interface{}
	}{
		{
			name: "Success",
			setupMock: func(m *MockTaskService) {
				tasks := []models.TaskDto{
					{ID: "1", TaskName: "Task 1"},
					{ID: "2", TaskName: "Task 2"},
				}
				m.On("GetAllTasks", mock.Anything).Return(tasks, nil)
			},
			expectedStatus: http.StatusOK,
			expectedBody: []models.TaskDto{
				{ID: "1", TaskName: "Task 1"},
				{ID: "2", TaskName: "Task 2"},
			},
		},
		{
			name: "Internal Server Error",
			setupMock: func(m *MockTaskService) {
				m.On("GetAllTasks", mock.Anything).Return(nil, errors.New("database error"))
			},
			expectedStatus: http.StatusInternalServerError,
			expectedBody:   gin.H{"error": "database error"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Setup
			mockService := new(MockTaskService)
			tt.setupMock(mockService)
			handler := &TaskHandler{service: mockService}

			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Request, _ = http.NewRequest(http.MethodGet, "/tasks", nil)

			// Execute
			handler.GetAllTasks(c)

			// Assert
			assert.Equal(t, tt.expectedStatus, w.Code)

			var response interface{}
			err := sonic.Unmarshal(w.Body.Bytes(), &response)
			assert.NoError(t, err)

			expectedJSON, _ := sonic.Marshal(tt.expectedBody)
			actualJSON, _ := sonic.Marshal(response)
			assert.JSONEq(t, string(expectedJSON), string(actualJSON))

			mockService.AssertExpectations(t)
		})
	}
}
