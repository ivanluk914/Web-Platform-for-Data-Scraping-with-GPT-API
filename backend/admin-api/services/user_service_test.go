package services

import (
	"admin-api/models"
	"context"
	"errors"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/uptrace/opentelemetry-go-extra/otelzap"
	"go.uber.org/zap"
)

type MockAuthClient struct {
	mock.Mock
}

func (m *MockAuthClient) GetUserFromContext(ctx context.Context) (*models.User, error) {
	args := m.Called(ctx)
	return args.Get(0).(*models.User), args.Error(1)
}

func (m *MockAuthClient) ListUsers(ctx context.Context, page int64, pageSize int64) ([]*models.User, int64, error) {
	args := m.Called(ctx, page, pageSize)
	return args.Get(0).([]*models.User), args.Get(1).(int64), args.Error(2)
}

func (m *MockAuthClient) ListAllUsers(ctx context.Context) ([]*models.User, error) {
	args := m.Called(ctx.Done())
	return args.Get(0).([]*models.User), args.Error(1)
}

func (m *MockAuthClient) GetUser(ctx context.Context, userID string) (*models.User, error) {
	args := m.Called(ctx, userID)
	return args.Get(0).(*models.User), args.Error(1)
}

func (m *MockAuthClient) UpdateUser(ctx context.Context, user *models.User) error {
	args := m.Called(ctx, user)
	return args.Error(0)
}

func (m *MockAuthClient) DeleteUser(ctx context.Context, userID string) error {
	args := m.Called(ctx, userID)
	return args.Error(0)
}

func (m *MockAuthClient) ListUserRoles(ctx context.Context, userID string) ([]models.UserRole, error) {
	args := m.Called(ctx, userID)
	return args.Get(0).([]models.UserRole), args.Error(1)
}

func (m *MockAuthClient) AssignUserRole(ctx context.Context, userID string, role models.UserRole) error {
	args := m.Called(ctx, userID, role)
	return args.Error(0)
}

func (m *MockAuthClient) RemoveUserRole(ctx context.Context, userID string, role models.UserRole) error {
	args := m.Called(ctx, userID, role)
	return args.Error(0)
}

func setupTestUserService() (*UserService, *MockAuthClient) {
	logger, _ := zap.NewDevelopment()
	mockAuthClient := new(MockAuthClient)
	service := NewUserService(otelzap.New(logger), mockAuthClient)
	return service, mockAuthClient
}

func TestListUsers(t *testing.T) {
	service, mockAuthClient := setupTestUserService()
	ctx := context.Background()

	t.Run("Successful retrieval", func(t *testing.T) {
		id1, name1, email1 := "1", "User 1", "user1@example.com"
		id2, name2, email2 := "2", "User 2", "user2@example.com"
		expectedUsers := []*models.User{
			{ID: &id1, Name: &name1, Email: &email1},
			{ID: &id2, Name: &name2, Email: &email2},
		}
		mockAuthClient.On("ListUsers", ctx, int64(0), int64(10)).Return(expectedUsers, int64(2), nil).Once()

		users, total, err := service.ListUsers(ctx, 1, 10)
		assert.NoError(t, err)
		assert.Equal(t, expectedUsers, users)
		assert.Equal(t, int64(2), total)
	})

	t.Run("Error from AuthClient", func(t *testing.T) {
		mockAuthClient.On("ListUsers", ctx, int64(0), int64(10)).Return([]*models.User(nil), int64(0), errors.New("auth client error")).Once()

		users, total, err := service.ListUsers(ctx, 1, 10)
		assert.Error(t, err)
		assert.Nil(t, users)
		assert.Equal(t, int64(0), total)
	})
}

func TestGetUser(t *testing.T) {
	service, mockAuthClient := setupTestUserService()
	ctx := context.Background()

	t.Run("Successful retrieval", func(t *testing.T) {
		id1, name1, email1 := "1", "User 1", "user1@example.com"
		expectedUser := &models.User{ID: &id1, Name: &name1, Email: &email1}
		mockAuthClient.On("GetUser", ctx, "1").Return(expectedUser, nil).Once()

		user, err := service.GetUser(ctx, "1")
		assert.NoError(t, err)
		assert.Equal(t, expectedUser, user)
	})

	t.Run("User not found", func(t *testing.T) {
		mockAuthClient.On("GetUser", ctx, "999").Return((*models.User)(nil), errors.New("user not found")).Once()

		user, err := service.GetUser(ctx, "999")
		assert.Error(t, err)
		assert.Nil(t, user)
	})
}

func TestUpdateUser(t *testing.T) {
	service, mockAuthClient := setupTestUserService()
	ctx := context.Background()

	t.Run("Successful update", func(t *testing.T) {
		id1, name1, email1 := "1", "Updated User", "updated@example.com"
		user := &models.User{ID: &id1, Name: &name1, Email: &email1}
		mockAuthClient.On("UpdateUser", ctx, user).Return(nil).Once()

		err := service.UpdateUser(ctx, user)
		assert.NoError(t, err)
	})

	t.Run("Update error", func(t *testing.T) {
		id1, name1, email1 := "1", "Updated User", "updated@example.com"
		user := &models.User{ID: &id1, Name: &name1, Email: &email1}
		mockAuthClient.On("UpdateUser", ctx, user).Return(errors.New("update error")).Once()

		err := service.UpdateUser(ctx, user)
		assert.Error(t, err)
	})
}

func TestDeleteUser(t *testing.T) {
	service, mockAuthClient := setupTestUserService()
	ctx := context.Background()

	t.Run("Successful deletion", func(t *testing.T) {
		mockAuthClient.On("DeleteUser", ctx, "1").Return(nil).Once()

		err := service.DeleteUser(ctx, "1")
		assert.NoError(t, err)
	})

	t.Run("Deletion error", func(t *testing.T) {
		mockAuthClient.On("DeleteUser", ctx, "1").Return(errors.New("deletion error")).Once()

		err := service.DeleteUser(ctx, "1")
		assert.Error(t, err)
	})
}

func TestListUserRoles(t *testing.T) {
	service, mockAuthClient := setupTestUserService()
	ctx := context.Background()

	t.Run("Successful retrieval", func(t *testing.T) {
		expectedRoles := []models.UserRole{models.UserRoleAdmin, models.UserRoleUser}
		mockAuthClient.On("ListUserRoles", ctx, "1").Return(expectedRoles, nil).Once()

		roles, err := service.ListUserRoles(ctx, "1")
		assert.NoError(t, err)
		assert.Equal(t, expectedRoles, roles)
	})

	t.Run("Error from AuthClient", func(t *testing.T) {
		mockAuthClient.On("ListUserRoles", ctx, "1").Return([]models.UserRole(nil), errors.New("auth client error")).Once()

		roles, err := service.ListUserRoles(ctx, "1")
		assert.Error(t, err)
		assert.Nil(t, roles)
	})
}

func TestAssignUserRole(t *testing.T) {
	service, mockAuthClient := setupTestUserService()
	ctx := context.Background()

	t.Run("Successful assignment", func(t *testing.T) {
		mockAuthClient.On("AssignUserRole", ctx, "1", models.UserRoleAdmin).Return(nil).Once()

		err := service.AssignUserRole(ctx, "1", models.UserRoleAdmin)
		assert.NoError(t, err)
	})

	t.Run("Assignment error", func(t *testing.T) {
		mockAuthClient.On("AssignUserRole", ctx, "1", models.UserRoleAdmin).Return(errors.New("assignment error")).Once()

		err := service.AssignUserRole(ctx, "1", models.UserRoleAdmin)
		assert.Error(t, err)
	})
}

func TestRemoveUserRole(t *testing.T) {
	service, mockAuthClient := setupTestUserService()
	ctx := context.Background()

	t.Run("Successful removal", func(t *testing.T) {
		mockAuthClient.On("RemoveUserRole", ctx, "1", models.UserRoleAdmin).Return(nil).Once()

		err := service.RemoveUserRole(ctx, "1", models.UserRoleAdmin)
		assert.NoError(t, err)
	})

	t.Run("Removal error", func(t *testing.T) {
		mockAuthClient.On("RemoveUserRole", ctx, "1", models.UserRoleAdmin).Return(errors.New("removal error")).Once()

		err := service.RemoveUserRole(ctx, "1", models.UserRoleAdmin)
		assert.Error(t, err)
	})
}
