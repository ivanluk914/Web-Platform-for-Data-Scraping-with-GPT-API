package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"admin-api/models"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"gorm.io/gorm"
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

	jobId, err := strconv.ParseUint(c.Param("userId"), 10, 64)
	if err != nil {
		logger.Error("Failed to parse job id", zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	j, err := models.GetJobFromCache(c, jobId)
	if err != nil {
		logger.Error("Error while getting job from cache", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if j != nil {
		c.JSON(http.StatusOK, j)
		return
	}

	job, err := models.GetJobById(jobId)
	if err != nil {
		logger.Error("Error while getting job from db", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if err := models.SetJobCache(c, &job); err != nil {
		logger.Error("Error while setting job in cache", zap.Error(err))
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

	jobId, err := strconv.ParseUint(c.Param("userId"), 10, 64)
	if err != nil {
		logger.Error("Failed to parse job id", zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	job := models.Job{
		Model:          gorm.Model{ID: uint(jobId)},
		Owner:          c.Param("userId"),
		TaskDefinition: taskJson,
		Status:         models.JobStatusCreated,
	}

	if err := models.ClearJobCache(c, jobId); err != nil {
		logger.Error("Failed to update job", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if err := models.UpdateJob(job); err != nil {
		logger.Error("Failed to update job", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, job)
}
