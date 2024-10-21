package handlers

import (
	"admin-api/models"
	"context"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type UserService interface {
	ListUsers(ctx context.Context, page int64, pageSize int64) ([]*models.User, int64, error)
	GetUser(ctx context.Context, userID string) (*models.User, error)
	UpdateUser(ctx context.Context, user *models.User) error
	DeleteUser(ctx context.Context, userID string) error
	ListUserRoles(ctx context.Context, userID string) ([]models.UserRole, error)
	AssignUserRole(ctx context.Context, userID string, role models.UserRole) error
	RemoveUserRole(ctx context.Context, userID string, role models.UserRole) error
}

type UserHandler struct {
	service UserService
}

func SetupUserRoutes(r *gin.RouterGroup, service UserService) {
	handler := &UserHandler{service: service}

	tasks := r.Group("/user")
	{
		tasks.GET("", handler.ListUsers)
		tasks.GET(":userId", handler.GetUser)
		tasks.PUT(":userId", handler.UpdateUser)
		tasks.DELETE(":userId", handler.DeleteUser)
		tasks.GET(":userId/roles", handler.ListUserRoles)
		tasks.POST(":userId/roles", handler.AssignUserRole)
		tasks.DELETE(":userId/roles", handler.RemoveUserRole)
	}
}

func (h *UserHandler) ListUsers(c *gin.Context) {
	page, err := strconv.ParseInt(c.DefaultQuery("page", "1"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	pageSize, err := strconv.ParseInt(c.DefaultQuery("pageSize", "10"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	users, total, err := h.service.ListUsers(c.Request.Context(), page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	resp := models.ListUsersResponse[*models.User]{
		PaginatedResponse: models.PaginatedResponse[*models.User]{
			Total: total,
			Data:  users,
		},
	}

	c.JSON(http.StatusOK, resp)
}

func (h *UserHandler) GetUser(c *gin.Context) {
	user, err := h.service.GetUser(c.Request.Context(), c.Param("userId"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, user)
}

func (h *UserHandler) UpdateUser(c *gin.Context) {
	var createUserModel *models.User
	if err := c.ShouldBindJSON(&createUserModel); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.service.UpdateUser(c.Request.Context(), createUserModel)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
}

func (h *UserHandler) DeleteUser(c *gin.Context) {
	err := h.service.DeleteUser(c.Request.Context(), c.Param("userId"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
}

func (h *UserHandler) ListUserRoles(c *gin.Context) {
	roles, err := h.service.ListUserRoles(c.Request.Context(), c.Param("userId"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, roles)
}

func (h *UserHandler) AssignUserRole(c *gin.Context) {
	var req models.AssignUserRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.service.AssignUserRole(c.Request.Context(), c.Param("userId"), req.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
}

func (h *UserHandler) RemoveUserRole(c *gin.Context) {
	var req models.RemoveUserRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.service.RemoveUserRole(c.Request.Context(), c.Param("userId"), req.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
}
