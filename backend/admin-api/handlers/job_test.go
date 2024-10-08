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

// MockJobService is a mock implementation of the job service
type MockJobService struct {
	mock.Mock
}

func (m *MockJobService) GetJobsByUserId(ctx context.Context, userId string) ([]models.Job, error) {
	args := m.Called(ctx, userId)
	return args.Get(0).([]models.Job), args.Error(1)
}

func (m *MockJobService) GetJobById(ctx context.Context, jobId string) (*models.Job, error) {
	args := m.Called(ctx, jobId)
	return args.Get(0).(*models.Job), args.Error(1)
}

func (m *MockJobService) CreateJob(ctx context.Context, task models.TaskDefinition, userID string) (*models.Job, error) {
	args := m.Called(ctx, task, userID)
	return args.Get(0).(*models.Job), args.Error(1)
}

func (m *MockJobService) UpdateJob(ctx context.Context, task models.TaskDefinition, userID string, jobID string) (*models.Job, error) {
	args := m.Called(ctx, task, userID, jobID)
	return args.Get(0).(*models.Job), args.Error(1)
}

func setupTestRouter() (*gin.Engine, *MockJobService) {
	gin.SetMode(gin.TestMode)
	r := gin.Default()
	mockService := new(MockJobService)
	SetupJobRoutes(r.Group("/users/:userId"), mockService)
	return r, mockService
}

func TestGetJobs(t *testing.T) {
	r, mockService := setupTestRouter()
	server := httptest.NewServer(r)
	defer server.Close()

	t.Run("Successful retrieval", func(t *testing.T) {
		task1 := mockTaskDefinition()
		taskJSON1, _ := sonic.Marshal(task1)
		task2 := mockTaskDefinition()
		taskJSON2, _ := sonic.Marshal(task2)
		mockJobs := []models.Job{
			{Owner: "user1", TaskId: "task1", Status: models.JobStatusCreated, TaskDefinition: taskJSON1},
			{Owner: "user1", TaskId: "task2", Status: models.JobStatusFailed, TaskDefinition: taskJSON2},
		}
		mockService.On("GetJobsByUserId", mock.Anything, "user1").Return(mockJobs, nil).Once()

		resp, err := http.Get(fmt.Sprintf("%s/users/user1/job", server.URL))
		assert.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		var response []models.Job
		err = decoder.NewStreamDecoder(resp.Body).Decode(&response)
		assert.NoError(t, err)
		assert.Equal(t, mockJobs, response)
	})
}

func TestGetJob(t *testing.T) {
	r, mockService := setupTestRouter()
	server := httptest.NewServer(r)
	defer server.Close()

	t.Run("Successful retrieval", func(t *testing.T) {
		task := mockTaskDefinition()
		taskJSON, _ := sonic.Marshal(task)
		mockJob := &models.Job{Owner: "user1", TaskId: "task1", Status: models.JobStatusCreated, TaskDefinition: taskJSON}
		mockService.On("GetJobById", mock.Anything, "1").Return(mockJob, nil).Once()

		resp, err := http.Get(fmt.Sprintf("%s/users/user1/job/1", server.URL))
		assert.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		var response models.Job
		err = decoder.NewStreamDecoder(resp.Body).Decode(&response)
		assert.NoError(t, err)
		assert.Equal(t, mockJob, &response)
	})
}

func TestCreateJob(t *testing.T) {
	r, mockService := setupTestRouter()
	server := httptest.NewServer(r)
	defer server.Close()

	t.Run("Successful creation", func(t *testing.T) {
		task := mockTaskDefinition()
		taskJSON, _ := sonic.Marshal(task)
		mockJob := &models.Job{Owner: "user1", TaskId: "task1", Status: models.JobStatusCreated, TaskDefinition: taskJSON}
		mockService.On("CreateJob", mock.Anything, task, "user1").Return(mockJob, nil).Once()

		resp, err := http.Post(fmt.Sprintf("%s/users/user1/job", server.URL), "application/json", bytes.NewBuffer(taskJSON))
		assert.NoError(t, err)
		assert.Equal(t, http.StatusCreated, resp.StatusCode)

		var response models.Job
		err = decoder.NewStreamDecoder(resp.Body).Decode(&response)
		assert.NoError(t, err)
		assert.Equal(t, mockJob, &response)
	})
}

func TestUpdateJob(t *testing.T) {
	r, mockService := setupTestRouter()
	server := httptest.NewServer(r)
	defer server.Close()

	t.Run("Successful update", func(t *testing.T) {
		task := mockTaskDefinitionWithRandomPeriod()
		taskJSON, _ := sonic.Marshal(task)
		mockJob := &models.Job{Owner: "user1", TaskId: "task1", Status: models.JobStatusRunning, TaskDefinition: taskJSON}
		mockService.On("UpdateJob", mock.Anything, task, "user1", "1").Return(mockJob, nil).Once()

		req, _ := http.NewRequest(http.MethodPut, fmt.Sprintf("%s/users/user1/job/1", server.URL), bytes.NewBuffer(taskJSON))
		req.Header.Set("Content-Type", "application/json")
		resp, err := http.DefaultClient.Do(req)
		assert.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		var response models.Job
		err = decoder.NewStreamDecoder(resp.Body).Decode(&response)
		assert.NoError(t, err)
		assert.Equal(t, mockJob, &response)
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
