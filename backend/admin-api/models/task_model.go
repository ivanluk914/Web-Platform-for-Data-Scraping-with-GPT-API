package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"fmt"

	"github.com/bytedance/sonic"
	"gorm.io/gorm"
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
	Type   OutputType `json:"type"`
	Prompt string     `json:"prompt,omitempty"`
}

type TaskDefinition struct {
	Source []UrlSource `json:"source"`
	Target []Target    `json:"target"`
	Output []Output    `json:"output"`
	Period TaskPeriod  `json:"period"`
}

type TaskStatus int64

const (
	TaskStatusUnknown TaskStatus = iota
	TaskStatusCreated
	TaskStatusRunning
	TaskStatusComplete
	TaskStatusFailed
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
	case TaskStatusCreated, TaskStatusRunning, TaskStatusComplete, TaskStatusFailed:
		*r = TaskStatus(v)
		return nil
	case TaskStatusUnknown:
		return fmt.Errorf("TaskStatus must not be empty")
	default:
		return fmt.Errorf("invalid TaskStatus value: %d", v)
	}
}

type Task struct {
	gorm.Model
	Owner          string          `json:"owner" gorm:"index:idx_owner"`
	TaskDefinition json.RawMessage `gorm:"type:jsonb" json:"task_definition"`
	TaskId         string          `json:"task_id" gorm:"index:idx_task_id"`
	Status         TaskStatus      `json:"status"`
}

func GetTasksByUserId(uid string) ([]Task, error) {
	var tasks []Task
	result := db.Where("owner = ?", uid).Find(&tasks)
	if result.Error != nil {
		return nil, result.Error
	}
	return tasks, nil
}

func GetTaskById(jid uint64) (*Task, error) {
	var task *Task
	result := db.Where("id = ?", jid).First(&task)
	if result.Error != nil {
		return nil, result.Error
	}
	return task, nil
}

func CreateTask(task Task) error {
	result := db.Create(&task)
	if result.Error != nil {
		return result.Error
	}
	return nil
}

func UpdateTask(task Task) error {
	result := db.Model(&task).Updates(task)
	if result.Error != nil {
		return result.Error
	}
	return nil
}
