package handlers

import (
	"context"
	"net/http"

	"admin-api/models"

	"github.com/gin-gonic/gin"
)

type TaskService interface {
	GetTasksByUserId(ctx context.Context, userId string) ([]models.Task, error)
	GetTaskById(ctx context.Context, taskID string) (*models.Task, error)
	CreateTask(ctx context.Context, task models.TaskDefinition, userID string) (*models.Task, error)
	UpdateTask(ctx context.Context, task models.TaskDefinition, userID string, taskID string) (*models.Task, error)
}

type TaskHandler struct {
	service TaskService
}

func SetupTaskRoutes(r *gin.RouterGroup, service TaskService) {
	handler := &TaskHandler{service: service}

	userTasks := r.Group("/user/:userId/task")
	{
		userTasks.GET("", handler.GetTasks)
		userTasks.GET("/:taskId", handler.GetTask)
		userTasks.POST("", handler.CreateTask)
		userTasks.PUT("/:taskId", handler.UpdateTask)
	}
}

func (h *TaskHandler) GetTasks(c *gin.Context) {
	tasks, err := h.service.GetTasksByUserId(c, c.Param("userId"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, tasks)
}

func (h *TaskHandler) GetTask(c *gin.Context) {
	task, err := h.service.GetTaskById(c, c.Param("taskId"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, task)
}

func (h *TaskHandler) CreateTask(c *gin.Context) {
	var td models.TaskDefinition
	if err := c.ShouldBindJSON(&td); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	task, err := h.service.CreateTask(c, td, c.Param("userId"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, task)
}

func (h *TaskHandler) UpdateTask(c *gin.Context) {
	var td models.TaskDefinition
	if err := c.ShouldBindJSON(&td); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	task, err := h.service.UpdateTask(c, td, c.Param("userId"), c.Param("taskId"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, task)
}
