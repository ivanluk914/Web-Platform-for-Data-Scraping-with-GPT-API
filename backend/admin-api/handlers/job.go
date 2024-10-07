package handlers

import (
	"encoding/json"
	"net/http"

	"admin-api/models"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

func GetJobs(c *gin.Context) {
	logger := zap.L()
	jobs, err := models.GetJobsByUserId(c.Param("userId"))
	if err != nil {
		logger.Error("Failed find jobs", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, jobs)
}

func GetJob(c *gin.Context) {
	logger := zap.L()
	job, err := models.GetJobById(c.Param("jobId"))
	if err != nil {
		logger.Error("Failed find job", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, job)
}

func CreateJob(c *gin.Context) {
	logger := zap.L()
	var task models.TaskDefinition
	if err := c.ShouldBindJSON(&task); err != nil {
		logger.Error("Task definition is not valid", zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	taskJson, err := json.Marshal(task)
	if err != nil {
		logger.Error("Failed to marshal task definition", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	job := models.Job{
		Owner:          c.Param("userId"),
		TaskDefinition: taskJson,
		Status:         models.JobStatusCreated,
	}

	if err := models.CreateJob(job); err != nil {
		logger.Error("Failed to create job", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, job)
}

func UpdateJob(c *gin.Context) {
	logger := zap.L()
	var task models.TaskDefinition
	if err := c.ShouldBindJSON(&task); err != nil {
		logger.Error("Task definition is not valid", zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	taskJson, err := json.Marshal(task)
	if err != nil {
		logger.Error("Failed to marshal task definition", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	job := models.Job{
		Owner:          c.Param("userId"),
		TaskDefinition: taskJson,
		Status:         models.JobStatusCreated,
	}

	if err := models.UpdateJob(job); err != nil {
		logger.Error("Failed to update job", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, job)
}
