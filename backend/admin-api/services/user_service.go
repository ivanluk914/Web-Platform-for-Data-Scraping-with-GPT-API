package services

import (
	"admin-api/clients"
	"admin-api/models"
	"context"

	"github.com/uptrace/opentelemetry-go-extra/otelzap"
	"go.uber.org/zap"
)

type UserService struct {
	logger     *otelzap.Logger
	authClient clients.AuthClient
}

func NewUserService(logger *otelzap.Logger, authClient clients.AuthClient) *UserService {
	return &UserService{logger: logger, authClient: authClient}
}

func (s *UserService) ListUsers(ctx context.Context, page int64, pageSize int64) ([]*models.User, int64, error) {
	users, total, err := s.authClient.ListUsers(ctx, page, pageSize)
	if err != nil {
		s.logger.Ctx(ctx).Error("Failed to list users", zap.Int64("page", page), zap.Int64("page_size", pageSize), zap.Error(err))
		return nil, 0, err
	}
	return users, total, nil
}

func (s *UserService) GetUser(ctx context.Context, userID string) (*models.User, error) {
	user, err := s.authClient.GetUser(ctx, userID)
	if err != nil {
		s.logger.Ctx(ctx).Error("Failed to find user", zap.String("user_id", userID), zap.Error(err))
		return nil, err
	}
	return user, nil
}

func (s *UserService) UpdateUser(ctx context.Context, user *models.User) error {
	err := s.authClient.UpdateUser(ctx, user)
	if err != nil {
		s.logger.Ctx(ctx).Error("Failed to update user", zap.Any("user", user), zap.Error(err))
		return err
	}
	return nil
}

func (s *UserService) DeleteUser(ctx context.Context, userID string) error {
	err := s.authClient.DeleteUser(ctx, userID)
	if err != nil {
		s.logger.Ctx(ctx).Error("Failed to delete user", zap.String("user_id", userID), zap.Error(err))
		return err
	}
	return nil
}

func (s *UserService) ListUserRoles(ctx context.Context, userID string) ([]models.UserRole, error) {
	roles, err := s.authClient.ListUserRoles(ctx, userID)
	if err != nil {
		s.logger.Ctx(ctx).Error("Failed to list user roles", zap.String("user_id", userID), zap.Error(err))
		return nil, err
	}
	return roles, nil
}

func (s *UserService) AssignUserRole(ctx context.Context, userID string, role models.UserRole) error {
	err := s.authClient.AssignUserRole(ctx, userID, role)
	if err != nil {
		s.logger.Ctx(ctx).Error("Failed to assign user role", zap.String("user_id", userID), zap.String("role_id", role.String()), zap.Error(err))
		return err
	}
	return nil
}

func (s *UserService) RemoveUserRole(ctx context.Context, userID string, role models.UserRole) error {
	err := s.authClient.RemoveUserRole(ctx, userID, role)
	if err != nil {
		s.logger.Ctx(ctx).Error("Failed to remove user role", zap.String("user_id", userID), zap.String("role_id", role.String()), zap.Error(err))
		return err
	}
	return nil
}
