package handlers

import (
	"admin-api/models"
	"bytes"
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/bytedance/sonic"
	"github.com/bytedance/sonic/decoder"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockUserService is a mock implementation of the user service
type MockUserService struct {
	mock.Mock
}

func (m *MockUserService) ListUsers(ctx context.Context, page int64, pageSize int64) ([]*models.User, int64, error) {
	args := m.Called(ctx, page, pageSize)
	return args.Get(0).([]*models.User), args.Get(1).(int64), args.Error(2)
}

func (m *MockUserService) GetUser(ctx context.Context, userID string) (*models.User, error) {
	args := m.Called(ctx, userID)
	return args.Get(0).(*models.User), args.Error(1)
}

func (m *MockUserService) UpdateUser(ctx context.Context, user *models.User) error {
	args := m.Called(ctx, user)
	return args.Error(0)
}

func (m *MockUserService) DeleteUser(ctx context.Context, userID string) error {
	args := m.Called(ctx, userID)
	return args.Error(0)
}

func (m *MockUserService) ListUserRoles(ctx context.Context, userID string) ([]models.UserRole, error) {
	args := m.Called(ctx, userID)
	return args.Get(0).([]models.UserRole), args.Error(1)
}

func (m *MockUserService) AssignUserRole(ctx context.Context, userID string, role models.UserRole) error {
	args := m.Called(ctx, userID, role)
	return args.Error(0)
}

func (m *MockUserService) RemoveUserRole(ctx context.Context, userID string, role models.UserRole) error {
	args := m.Called(ctx, userID, role)
	return args.Error(0)
}

func setupUserTestRouter() (*gin.Engine, *MockUserService) {
	gin.SetMode(gin.TestMode)
	r := gin.Default()
	mockService := new(MockUserService)
	SetupUserRoutes(r.Group("/"), mockService)
	return r, mockService
}

func TestListUsers(t *testing.T) {
	r, mockService := setupUserTestRouter()
	server := httptest.NewServer(r)
	defer server.Close()

	t.Run("Successful retrieval", func(t *testing.T) {
		id1, name1, email1 := "1", "User 1", "user1@example.com"
		id2, name2, email2 := "2", "User 2", "user2@example.com"
		mockUsers := []*models.User{
			{ID: &id1, Name: &name1, Email: &email1},
			{ID: &id2, Name: &name2, Email: &email2},
		}
		mockService.On("ListUsers", mock.Anything, int64(1), int64(10)).Return(mockUsers, int64(2), nil).Once()

		resp, err := http.Get(fmt.Sprintf("%s/user?page=1&pageSize=10", server.URL))
		assert.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		var response models.ListUsersResponse[*models.User]
		err = decoder.NewStreamDecoder(resp.Body).Decode(&response)
		assert.NoError(t, err)
		assert.Equal(t, int64(2), response.Total)
		assert.Equal(t, mockUsers, response.Data)
	})
}

func TestGetUser(t *testing.T) {
	r, mockService := setupUserTestRouter()
	server := httptest.NewServer(r)
	defer server.Close()

	t.Run("Successful retrieval", func(t *testing.T) {
		id1, name1, email1 := "1", "User 1", "user1@example.com"
		mockUser := &models.User{ID: &id1, Name: &name1, Email: &email1}
		mockService.On("GetUser", mock.Anything, "1").Return(mockUser, nil).Once()

		resp, err := http.Get(fmt.Sprintf("%s/user/1", server.URL))
		assert.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		var response models.User
		err = decoder.NewStreamDecoder(resp.Body).Decode(&response)
		assert.NoError(t, err)
		assert.Equal(t, mockUser, &response)
	})
}

func TestUpdateUser(t *testing.T) {
	r, mockService := setupUserTestRouter()
	server := httptest.NewServer(r)
	defer server.Close()

	t.Run("Successful update", func(t *testing.T) {
		id1, name1, email1 := "1", "User 1", "user1@example.com"
		user := &models.User{ID: &id1, Name: &name1, Email: &email1}
		userJSON, _ := sonic.Marshal(user)
		mockService.On("UpdateUser", mock.Anything, user).Return(nil).Once()

		req, _ := http.NewRequest(http.MethodPut, fmt.Sprintf("%s/user/1", server.URL), bytes.NewBuffer(userJSON))
		req.Header.Set("Content-Type", "application/json")
		resp, err := http.DefaultClient.Do(req)
		assert.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)
	})
}

func TestDeleteUser(t *testing.T) {
	r, mockService := setupUserTestRouter()
	server := httptest.NewServer(r)
	defer server.Close()

	t.Run("Successful deletion", func(t *testing.T) {
		mockService.On("DeleteUser", mock.Anything, "1").Return(nil).Once()

		req, _ := http.NewRequest(http.MethodDelete, fmt.Sprintf("%s/user/1", server.URL), nil)
		resp, err := http.DefaultClient.Do(req)
		assert.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)
	})
}

func TestListUserRoles(t *testing.T) {
	r, mockService := setupUserTestRouter()
	server := httptest.NewServer(r)
	defer server.Close()

	t.Run("Successful retrieval", func(t *testing.T) {
		mockRoles := []models.UserRole{models.UserRoleAdmin, models.UserRoleUser}
		mockService.On("ListUserRoles", mock.Anything, "1").Return(mockRoles, nil).Once()

		resp, err := http.Get(fmt.Sprintf("%s/user/1/roles", server.URL))
		assert.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		var response []models.UserRole
		err = decoder.NewStreamDecoder(resp.Body).Decode(&response)
		assert.NoError(t, err)
		assert.Equal(t, mockRoles, response)
	})
}

func TestAssignUserRole(t *testing.T) {
	r, mockService := setupUserTestRouter()
	server := httptest.NewServer(r)
	defer server.Close()

	t.Run("Successful assignment", func(t *testing.T) {
		req := models.AssignUserRoleRequest{Role: models.UserRoleAdmin}
		reqJSON, _ := sonic.Marshal(req)
		mockService.On("AssignUserRole", mock.Anything, "1", models.UserRoleAdmin).Return(nil).Once()

		resp, err := http.Post(fmt.Sprintf("%s/user/1/roles", server.URL), "application/json", bytes.NewBuffer(reqJSON))
		assert.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)
	})
}

func TestRemoveUserRole(t *testing.T) {
	r, mockService := setupUserTestRouter()
	server := httptest.NewServer(r)
	defer server.Close()

	t.Run("Successful removal", func(t *testing.T) {
		req := models.RemoveUserRoleRequest{Role: models.UserRoleAdmin}
		reqJSON, _ := sonic.Marshal(req)
		mockService.On("RemoveUserRole", mock.Anything, "1", models.UserRoleAdmin).Return(nil).Once()

		request, _ := http.NewRequest(http.MethodDelete, fmt.Sprintf("%s/user/1/roles", server.URL), bytes.NewBuffer(reqJSON))
		request.Header.Set("Content-Type", "application/json")
		resp, err := http.DefaultClient.Do(request)
		assert.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)
	})
}
