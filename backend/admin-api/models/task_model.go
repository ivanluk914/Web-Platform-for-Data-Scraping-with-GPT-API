package models

import (
	"encoding/json"

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
	AirflowTaskId  string          `json:"airflow_task_id"`
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
