package handlers

import (
	"context"
	"net/http"
	"strconv"

	"admin-api/models"

	"github.com/gin-gonic/gin"
)

type TaskService interface {
	GetTasksByUserId(ctx context.Context, userId string) ([]models.TaskDto, error)
	GetTaskById(ctx context.Context, taskID string) (*models.TaskDto, error)
	CreateTask(ctx context.Context, task models.Task, userID string) (*models.Task, error)
	UpdateTask(ctx context.Context, task models.Task, userID string, taskID string) (*models.Task, error)
	ListTaskRuns(ctx context.Context, taskRunID string) ([]*models.TaskRunDto, error)
	GetTaskRunArtifacts(ctx context.Context, taskRunID string, page int, pageSize int) ([]*models.TaskRunArtifactDto, error)
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
		userTasks.GET("/:taskId/run", handler.ListTaskRuns)
		userTasks.GET("/:taskId/run/:runId/artifact", handler.GetTaskRunArtifacts)
	}
}

func (h *TaskHandler) GetTasks(c *gin.Context) {
	tasks, err := h.service.GetTasksByUserId(c.Request.Context(), c.Param("userId"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, tasks)
}

func (h *TaskHandler) GetTask(c *gin.Context) {
	task, err := h.service.GetTaskById(c.Request.Context(), c.Param("taskId"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, task)
}

func (h *TaskHandler) CreateTask(c *gin.Context) {
	var task models.Task
	if err := c.ShouldBindJSON(&task); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	createdTask, err := h.service.CreateTask(c.Request.Context(), task, c.Param("userId"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, createdTask)
}

func (h *TaskHandler) UpdateTask(c *gin.Context) {
	var task models.Task
	if err := c.ShouldBindJSON(&task); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updatedTask, err := h.service.UpdateTask(c.Request.Context(), task, c.Param("userId"), c.Param("taskId"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, updatedTask)
}

func (h *TaskHandler) ListTaskRuns(c *gin.Context) {
	taskRuns, err := h.service.ListTaskRuns(c.Request.Context(), c.Param("taskId"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, taskRuns)
}

func (h *TaskHandler) GetTaskRunArtifacts(c *gin.Context) {
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

	taskRunArtifacts, err := h.service.GetTaskRunArtifacts(c.Request.Context(), c.Param("runId"), int(page), int(pageSize))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, taskRunArtifacts)
}
