package models

import (
	"go.uber.org/zap"
	"gorm.io/gorm"
)

type User struct {
	gorm.Model
	Name  string `json:"name"`
	Email string `json:"email" gorm:"uniqueIndex"`
}

func GetUsers() ([]User, error) {
	var users []User
	result := db.Find(&users)
	if result.Error != nil {
		logger.Error("Failed to get users", zap.Error(result.Error))
		return nil, result.Error
	}
	return users, nil
}

func CreateUser(user *User) error {
	result := db.Create(user)
	if result.Error != nil {
		logger.Error("Failed to create user", zap.Error(result.Error))
		return result.Error
	}
	return nil
}
