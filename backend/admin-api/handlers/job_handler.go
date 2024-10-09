package handlers

import (
	"context"
	"net/http"

	"admin-api/models"

	"github.com/gin-gonic/gin"
)

type JobService interface {
	GetJobsByUserId(ctx context.Context, userId string) ([]models.Job, error)
	GetJobById(ctx context.Context, jobID string) (*models.Job, error)
	CreateJob(ctx context.Context, task models.TaskDefinition, userID string) (*models.Job, error)
	UpdateJob(ctx context.Context, task models.TaskDefinition, userID string, jobID string) (*models.Job, error)
}

type JobHandler struct {
	service JobService
}

func SetupJobRoutes(r *gin.RouterGroup, service JobService) {
	handler := &JobHandler{service: service}

	jobs := r.Group("/users/:userId/job")
	{
		jobs.GET("", handler.GetJobs)
		jobs.GET("/:jobId", handler.GetJob)
		jobs.POST("", handler.CreateJob)
		jobs.PUT("/:jobId", handler.UpdateJob)
	}
}

func (h *JobHandler) GetJobs(c *gin.Context) {
	jobs, err := h.service.GetJobsByUserId(c, c.Param("userId"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, jobs)
}

func (h *JobHandler) GetJob(c *gin.Context) {
	job, err := h.service.GetJobById(c, c.Param("jobId"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, job)
}

func (h *JobHandler) CreateJob(c *gin.Context) {
	var task models.TaskDefinition
	if err := c.ShouldBindJSON(&task); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	job, err := h.service.CreateJob(c, task, c.Param("userId"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, job)
}

func (h *JobHandler) UpdateJob(c *gin.Context) {
	var task models.TaskDefinition
	if err := c.ShouldBindJSON(&task); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	job, err := h.service.UpdateJob(c, task, c.Param("userId"), c.Param("jobId"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, job)
}
