package models

import (
	"context"
	"database/sql/driver"
	"errors"
	"fmt"
	"time"

	"github.com/bytedance/sonic"
	"gorm.io/gorm"
)

type TaskStatus int64

const (
	TaskStatusUnknown TaskStatus = iota
	TaskStatusCreated
	TaskStatusRunning
	TaskStatusComplete
	TaskStatusFailed
	TaskStatusCancelled
	TaskStatusPending
)

// Scan implements the sql.Scanner interface
func (r *TaskStatus) Scan(value interface{}) error {
	intValue, ok := value.(int64)
	if !ok {
		return errors.New("invalid value for TaskStatus")
	}
	*r = TaskStatus(intValue)
	return nil
}

// Value implements the driver.Valuer interface
func (r TaskStatus) Value() (driver.Value, error) {
	return int64(r), nil
}

// UnmarshalJSON implements the json.Unmarshaler interface
func (r *TaskStatus) UnmarshalJSON(data []byte) error {
	var v int64
	if err := sonic.Unmarshal(data, &v); err != nil {
		return err
	}
	switch TaskStatus(v) {
	case TaskStatusUnknown, TaskStatusCreated, TaskStatusRunning, TaskStatusComplete, TaskStatusFailed, TaskStatusCancelled, TaskStatusPending:
		*r = TaskStatus(v)
		return nil
	default:
		return fmt.Errorf("invalid TaskStatus value: %d", v)
	}
}

type TaskRun struct {
	gorm.Model
	TaskID            uint       `json:"task_id" gorm:"foreignKey:ID,index:idx_task_id"`
	AirflowInstanceID string     `json:"airflow_instance_id"`
	Status            TaskStatus `json:"status"`
	StartTime         time.Time  `json:"start_time"`
	EndTime           time.Time  `json:"end_time"`
	ErrorMessage      string     `json:"error_message"`
}

func ListRunsForTask(ctx context.Context, taskUid uint64) ([]TaskRun, error) {
	var taskRuns []TaskRun
	result := db.WithContext(ctx).Where("task_id = ?", taskUid).Find(&taskRuns)
	if result.Error != nil {
		return nil, result.Error
	}
	return taskRuns, nil
}

func GetTaskRun(ctx context.Context, uid uint64) (*TaskRun, error) {
	var run *TaskRun
	result := db.WithContext(ctx).Where("id = ?", uid).First(&run)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("task not found")
		}
		return nil, result.Error
	}
	return run, nil
}

func GetLatestRunForTask(ctx context.Context, uid uint64) (*TaskRun, error) {
	var run *TaskRun
	result := db.WithContext(ctx).Order("created_at desc").Where("task_id = ?", uid).First(&run)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, result.Error
	}
	return run, nil
}

func CreateTaskRun(ctx context.Context, taskRun TaskRun) (*TaskRun, error) {
	result := db.WithContext(ctx).Create(&taskRun)
	if result.Error != nil {
		return &taskRun, result.Error
	}
	return &taskRun, nil
}

func UpdateTaskRun(ctx context.Context, taskRun TaskRun, taskRunID uint64) (*TaskRun, error) {
	result := db.WithContext(ctx).Model(&TaskRun{}).Where("id = ?", taskRunID).Updates(taskRun)
	if result.Error != nil {
		return &taskRun, result.Error
	}
	if result.RowsAffected == 0 {
		return nil, errors.New("no task run found with the given ID")
	}
	return &taskRun, nil
}
