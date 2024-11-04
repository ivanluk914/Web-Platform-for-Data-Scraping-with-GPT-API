package handlers

import (
	"context"
	"net/http"
	"strconv"

	"admin-api/models"

	"github.com/gin-gonic/gin"
)

type TaskService interface {
	GetAllTasks(ctx context.Context) ([]models.TaskDto, error)
	GetTasksByUserId(ctx context.Context, userId string) ([]models.TaskDto, error)
	GetTaskById(ctx context.Context, taskID string) (*models.TaskDto, error)
	CreateTask(ctx context.Context, task models.Task, userID string) (*models.Task, error)
	UpdateTask(ctx context.Context, task models.Task, userID string, taskID string) (*models.Task, error)
	DeleteTask(ctx context.Context, taskID string) error
	ListTaskRuns(ctx context.Context, taskID string) ([]*models.TaskRunDto, error)
	GetTaskRun(ctx context.Context, taskRunID string) (*models.TaskRunDto, error)
	CreateTaskRun(ctx context.Context, taskRun models.TaskRun) (*models.TaskRun, error)
	UpdateTaskRun(ctx context.Context, taskRun models.TaskRun, taskRunID string) (*models.TaskRun, error)
	GetTaskRunArtifacts(ctx context.Context, taskRunID string, page int, pageSize int) ([]*models.TaskRunArtifactDto, error)
	CreateTaskRunArtifact(ctx context.Context, artifact *models.CreateTaskRunArtifactDto) (*models.TaskRunArtifact, error)
}

type TaskHandler struct {
	service TaskService
}

func SetupTaskRoutes(r *gin.RouterGroup, service TaskService) {
	handler := &TaskHandler{service: service}

	r.GET("/task", handler.GetAllTasks)

	userTasks := r.Group("/user/:userId/task")
	{
		userTasks.GET("", handler.GetTasks)
		userTasks.GET("/:taskId", handler.GetTask)
		userTasks.POST("", handler.CreateTask)
		userTasks.PUT("/:taskId", handler.UpdateTask)
		userTasks.DELETE("/:taskId", handler.DeleteTask)
		userTasks.GET("/:taskId/run", handler.ListTaskRuns)
		userTasks.POST("/:taskId/run", handler.CreateTaskRun)
		userTasks.GET("/:taskId/run/:runId", handler.GetTaskRun)
		userTasks.PUT("/:taskId/run/:runId", handler.UpdateTaskRun)
		userTasks.GET("/:taskId/run/:runId/artifact", handler.GetTaskRunArtifacts)
		userTasks.POST("/:taskId/run/:runId/artifact", handler.CreateTaskRunArtifact)
	}
}

func (h *TaskHandler) GetAllTasks(c *gin.Context) {
	tasks, err := h.service.GetAllTasks(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, tasks)
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

func (h *TaskHandler) DeleteTask(c *gin.Context) {
	err := h.service.DeleteTask(c.Request.Context(), c.Param("taskId"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
}

func (h *TaskHandler) ListTaskRuns(c *gin.Context) {
	taskRuns, err := h.service.ListTaskRuns(c.Request.Context(), c.Param("taskId"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, taskRuns)
}

func (h *TaskHandler) GetTaskRun(c *gin.Context) {
	taskRun, err := h.service.GetTaskRun(c.Request.Context(), c.Param("runId"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, taskRun)
}

func (h *TaskHandler) CreateTaskRun(c *gin.Context) {
	var taskRun models.TaskRun
	if err := c.ShouldBindJSON(&taskRun); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	createdTaskRun, err := h.service.CreateTaskRun(c.Request.Context(), taskRun)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, createdTaskRun)
}

func (h *TaskHandler) UpdateTaskRun(c *gin.Context) {
	var taskRun models.TaskRun
	if err := c.ShouldBindJSON(&taskRun); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	createdTaskRun, err := h.service.UpdateTaskRun(c.Request.Context(), taskRun, c.Param("runId"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, createdTaskRun)
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

func (h *TaskHandler) CreateTaskRunArtifact(c *gin.Context) {
	var taskRunArtifact models.CreateTaskRunArtifactDto
	if err := c.ShouldBindJSON(&taskRunArtifact); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	createdTaskRunArtifact, err := h.service.CreateTaskRunArtifact(c.Request.Context(), &taskRunArtifact)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, createdTaskRunArtifact)
}
