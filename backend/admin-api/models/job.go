package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"fmt"

	"github.com/bytedance/sonic"
	"go.uber.org/zap"
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

type JobPeriod int64

const (
	JobPeriodUnknown JobPeriod = iota
	JobPeriodHourly
	JobPeriodDaily
	JobPeriodWeekly
	JobPeriodMonthly
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
	Period JobPeriod   `json:"period"`
}

type JobStatus int64

const (
	JobStatusUnknown JobStatus = iota
	JobStatusCreated
	JobStatusRunning
	JobStatusComplete
	JobStatusFailed
)

// Scan implements the sql.Scanner interface
func (r *JobStatus) Scan(value interface{}) error {
	intValue, ok := value.(int64)
	if !ok {
		return errors.New("invalid value for JobStatus")
	}
	*r = JobStatus(intValue)
	return nil
}

// Value implements the driver.Valuer interface
func (r JobStatus) Value() (driver.Value, error) {
	return int64(r), nil
}

// UnmarshalJSON implements the json.Unmarshaler interface
func (r *JobStatus) UnmarshalJSON(data []byte) error {
	var v int64
	if err := sonic.Unmarshal(data, &v); err != nil {
		return err
	}
	switch JobStatus(v) {
	case JobStatusCreated, JobStatusRunning, JobStatusComplete, JobStatusFailed:
		*r = JobStatus(v)
		return nil
	case JobStatusUnknown:
		return fmt.Errorf("JobStatus must not be empty")
	default:
		return fmt.Errorf("invalid JobStatus value: %d", v)
	}
}

type Job struct {
	gorm.Model
	Owner          string          `json:"owner" gorm:"index:idx_owner"`
	TaskDefinition json.RawMessage `gorm:"type:jsonb" json:"task_definition"`
	TaskId         string          `json:"task_id" gorm:"index:idx_task_id"`
	Status         JobStatus       `json:"status"`
}

func GetJobsByUserId(uid string) ([]Job, error) {
	var jobs []Job
	result := db.Where("owner = ?", uid).Find(&jobs)
	if result.Error != nil {
		zap.L().Error("Failed to get jobs for user", zap.String("user id", uid), zap.Error(result.Error))
		return nil, result.Error
	}
	return jobs, nil
}

func GetJobById(jid uint64) (*Job, error) {
	var job *Job
	result := db.Where("id = ?", jid).First(&job)
	if result.Error != nil {
		zap.L().Error("Failed to get job", zap.Uint64("job id", jid), zap.Error(result.Error))
		return nil, result.Error
	}
	return job, nil
}

func CreateJob(job Job) error {
	result := db.Create(&job)
	if result.Error != nil {
		zap.L().Error("Failed to create job", zap.Any("job", job), zap.Error(result.Error))
		return result.Error
	}
	return nil
}

func UpdateJob(job Job) error {
	result := db.Model(&job).Updates(job)
	if result.Error != nil {
		zap.L().Error("Failed to update job", zap.Any("job", job), zap.Error(result.Error))
		return result.Error
	}
	return nil
}
