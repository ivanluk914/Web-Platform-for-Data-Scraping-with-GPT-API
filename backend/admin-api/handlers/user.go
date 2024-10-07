package handlers

import (
	"net/http"

	"admin-api/models"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

func GetUsers(c *gin.Context) {
	logger := zap.L()
	users, err := models.GetUsers()
	if err != nil {
		logger.Error("Failed to get users", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, users)
}

func CreateUser(c *gin.Context) {
	logger := zap.L()
	var user models.User
	if err := c.ShouldBindJSON(&user); err != nil {
		logger.Error("Failed to bind JSON", zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := models.CreateUser(&user); err != nil {
		logger.Error("Failed to create user", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, user)
}
