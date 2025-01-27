package services

import (
	"admin-api/clients"
	"admin-api/models"
	"context"

	"github.com/uptrace/opentelemetry-go-extra/otelzap"
	"go.uber.org/zap"
	"golang.org/x/sync/errgroup"
)

type UserService struct {
	logger     *otelzap.Logger
	authClient clients.AuthClient
}

func NewUserService(logger *otelzap.Logger, authClient clients.AuthClient) *UserService {
	return &UserService{logger: logger, authClient: authClient}
}

func (s *UserService) ListUsers(ctx context.Context, page int64, pageSize int64) ([]*models.User, int64, error) {
	users, total, err := s.authClient.ListUsers(ctx, page-1, pageSize) // auth0 is 0-indexed, api is 1-indexed
	if err != nil {
		s.logger.Ctx(ctx).Error("Failed to list users", zap.Int64("page", page), zap.Int64("page_size", pageSize), zap.Error(err))
		return nil, 0, err
	}

	g, ctx := errgroup.WithContext(ctx)

	for _, user := range users {
		g.Go(func() error {
			// Try get from cache
			userRoles, err := models.GetUserRolesFromCache(ctx, *user.ID)
			if err != nil {
				return err
			}
			if userRoles != nil {
				user.Roles = userRoles
				return nil
			}

			// Else query db
			userRoles, err = s.authClient.ListUserRoles(ctx, *user.ID)
			if err != nil {
				s.logger.Ctx(ctx).Error("Failed to list user roles", zap.String("user_id", *user.ID), zap.Error(err))
				return err
			}
			if err := models.SetUserRolesCache(ctx, *user.ID, userRoles); err != nil {
				s.logger.Ctx(ctx).Error("Failed to set user roles in cache", zap.String("user_id", *user.ID), zap.Error(err))
			}
			user.Roles = userRoles
			return nil
		})
	}

	if err := g.Wait(); err != nil {
		return nil, 0, err
	}
	return users, total, nil
}

func (s *UserService) GetUser(ctx context.Context, userID string) (*models.User, error) {
	user, err := models.GetUserFromCache(ctx, userID)
	if err != nil {
		s.logger.Ctx(ctx).Error("Failed to get user from cache", zap.String("user_id", userID), zap.Error(err))
		return nil, err
	}
	if user != nil {
		return user, nil
	}

	user, err = s.authClient.GetUser(ctx, userID)
	if err != nil {
		s.logger.Ctx(ctx).Error("Failed to find user", zap.String("user_id", userID), zap.Error(err))
		return nil, err
	}

	if err := models.SetUserCache(ctx, user); err != nil {
		s.logger.Ctx(ctx).Error("Failed to set user in cache", zap.String("user_id", userID), zap.Error(err))
	}

	return user, nil
}

func (s *UserService) UpdateUser(ctx context.Context, user *models.User) error {
	err := s.authClient.UpdateUser(ctx, user)
	if err != nil {
		s.logger.Ctx(ctx).Error("Failed to update user", zap.Any("user", user), zap.Error(err))
		return err
	}
	if err := models.ClearUserCache(ctx, *user.ID); err != nil {
		s.logger.Ctx(ctx).Error("Failed to clear user from cache", zap.String("user_id", *user.ID), zap.Error(err))
	}
	return nil
}

func (s *UserService) DeleteUser(ctx context.Context, userID string) error {
	err := s.authClient.DeleteUser(ctx, userID)
	if err != nil {
		s.logger.Ctx(ctx).Error("Failed to delete user", zap.String("user_id", userID), zap.Error(err))
		return err
	}
	if err := models.ClearUserCache(ctx, userID); err != nil {
		s.logger.Ctx(ctx).Error("Failed to clear user from cache", zap.String("user_id", userID), zap.Error(err))
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
	if err := models.ClearUserCache(ctx, userID); err != nil {
		s.logger.Ctx(ctx).Error("Failed to clear user from cache", zap.String("user_id", userID), zap.Error(err))
	}
	if err := models.ClearUserRolesCache(ctx, userID); err != nil {
		s.logger.Ctx(ctx).Error("Failed to clear user roles from cache", zap.String("user_id", userID), zap.Error(err))
	}
	return nil
}

func (s *UserService) RemoveUserRole(ctx context.Context, userID string, role models.UserRole) error {
	err := s.authClient.RemoveUserRole(ctx, userID, role)
	if err != nil {
		s.logger.Ctx(ctx).Error("Failed to remove user role", zap.String("user_id", userID), zap.String("role_id", role.String()), zap.Error(err))
		return err
	}
	if err := models.ClearUserCache(ctx, userID); err != nil {
		s.logger.Ctx(ctx).Error("Failed to clear user from cache", zap.String("user_id", userID), zap.Error(err))
	}
	if err := models.ClearUserRolesCache(ctx, userID); err != nil {
		s.logger.Ctx(ctx).Error("Failed to clear user roles from cache", zap.String("user_id", userID), zap.Error(err))
	}
	return nil
}
