package models

import (
	"context"
	"encoding/json"
	"errors"

	"gorm.io/gorm"
)

type TaskRunType int64

const (
	TaskRunTypeUnknown TaskRunType = iota
	TaskRunTypePreview
	TaskRunTypeSingle
	TaskRunTypePeriodic
)

type OutputType int64

const (
	OutputTypeUnknown OutputType = iota
	OutputTypeJson
	OutputTypeCsv
	OutputTypeGpt
	OutputTypeMarkdown
)

type SourceType int64

const (
	SourceTypeUnknown SourceType = iota
	SourceTypeUrl
)

type TargetType int64

const (
	TargetTypeUnknown TargetType = iota
	TargetTypeAuto    TargetType = 1
	TargetTypeXpath   TargetType = 2
	TargetTypeQuery   TargetType = 3
)

type TaskPeriod int64

const (
	TaskPeriodUnknown TaskPeriod = iota
	TaskPeriodSingle
	TaskPeriodMinutely
	TaskPeriodHourly
	TaskPeriodDaily
	TaskPeriodWeekly
	TaskPeriodMonthly
)

type UrlSource struct {
	Type SourceType `json:"type"`
	URL  string     `json:"url"`
}

type AutoTarget struct {
	Type  TargetType `json:"type"`
	Value string     `json:"value"`
}

type XpathTarget struct {
	Type  TargetType `json:"type"`
	Name  string     `json:"name"`
	Value string     `json:"value"`
}

type QueryTarget struct {
	Type  TargetType `json:"type"`
	Name  string     `json:"name"`
	Value string     `json:"value"`
}

type JsonOutput struct {
	Type OutputType `json:"type"`
}

type CsvOutput struct {
	Type OutputType `json:"type"`
}

type GptOutput struct {
	Type   OutputType `json:"type"`
	Prompt string     `json:"prompt"`
}

type MarkdownOutput struct {
	Type OutputType `json:"type"`
}

type Target struct {
	Type  TargetType `json:"type"`
	Name  string     `json:"name,omitempty"`
	Value string     `json:"value"`
}

type Output struct {
	Type  OutputType `json:"type"`
	Name  string     `json:"name,omitempty"`
	Value string     `json:"value"`
}

type TaskDefinition struct {
	Type   TaskRunType `json:"type"`
	Source []UrlSource `json:"source"`
	Target []Target    `json:"target"`
	Output []Output    `json:"output"`
	Period TaskPeriod  `json:"period"`
}

type Task struct {
	gorm.Model
	Owner          string          `json:"owner" gorm:"index:idx_owner"`
	TaskName       string          `json:"task_name"`
	TaskDefinition json.RawMessage `json:"task_definition" gorm:"type:jsonb"`
	Status         TaskStatus      `json:"status"`
	AirflowTaskId  string          `json:"airflow_task_id"`
}

func GetAllTasks(ctx context.Context) ([]Task, error) {
	var tasks []Task
	result := db.WithContext(ctx).Find(&tasks)
	if result.Error != nil {
		return nil, result.Error
	}
	return tasks, nil
}

func GetTasksByUserId(ctx context.Context, uid string) ([]Task, error) {
	var tasks []Task
	result := db.WithContext(ctx).Where("owner = ?", uid).Find(&tasks)
	if result.Error != nil {
		return nil, result.Error
	}
	return tasks, nil
}

func GetTaskById(ctx context.Context, jid uint64) (*Task, error) {
	var task *Task
	result := db.WithContext(ctx).Where("id = ?", jid).First(&task)
	if result.Error != nil {
		return nil, result.Error
	}
	return task, nil
}

func CreateTask(ctx context.Context, task Task) (*Task, error) {
	result := db.WithContext(ctx).Create(&task)
	if result.Error != nil {
		return nil, result.Error
	}
	return &task, nil
}

func UpdateTask(ctx context.Context, task Task) (*Task, error) {
	result := db.WithContext(ctx).Model(&Task{}).Where("id = ?", task.ID).Updates(task)
	if result.Error != nil {
		return nil, result.Error
	}
	if result.RowsAffected == 0 {
		return nil, errors.New("no task found with the given ID")
	}
	return &task, nil
}

func DeleteTask(ctx context.Context, taskID uint64) error {
	result := db.WithContext(ctx).Delete(&Task{}, taskID)
	if result.Error != nil {
		return result.Error
	}
	return nil
}
