package models

import "time"

type PaginatedResponse[T any] struct {
	Total int64 `json:"total"`
	Data  []T   `json:"data"`
}

type ListUsersResponse[T any] struct {
	PaginatedResponse[T]
}

type AssignUserRoleRequest struct {
	Role UserRole `json:"role"`
}

type RemoveUserRoleRequest struct {
	Role UserRole `json:"role"`
}

type TaskDto struct {
	ID             string     `json:"id"`
	TaskName       string     `json:"task_name"`
	TaskDefinition string     `json:"task_definition"`
	Status         TaskStatus `json:"status"`
	Owner          string     `json:"owner"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
	DeletedAt      time.Time  `json:"deleted_at"`
}

type TaskRunDto struct {
	TaskID       string     `json:"task_id"`
	Status       TaskStatus `json:"status"`
	StartTime    time.Time  `json:"start_time"`
	EndTime      time.Time  `json:"end_time"`
	ErrorMessage string     `json:"error_message"`
}

type TaskRunArtifactDto struct {
	AirflowInstanceID string            `json:"airflow_instance_id"`
	AirflowTaskID     string            `json:"airflow_task_id"`
	ArtifactID        string            `json:"artifact_id"`
	CreatedAt         time.Time         `json:"created_at"`
	ArtifactType      string            `json:"artifact_type"`
	URL               string            `json:"url"`
	ContentType       string            `json:"content_type"`
	ContentLength     int               `json:"content_length"`
	StatusCode        int               `json:"status_code"`
	AdditionalData    map[string]string `json:"additional_data"`
}

type CreateTaskRunArtifactDto struct {
	AirflowInstanceID string            `json:"airflow_instance_id"`
	AirflowTaskID     string            `json:"airflow_task_id"`
	ArtifactID        string            `json:"artifact_id"`
	CreatedAt         time.Time         `json:"created_at"`
	ArtifactType      string            `json:"artifact_type"`
	URL               string            `json:"url"`
	ContentType       string            `json:"content_type"`
	ContentLength     int               `json:"content_length"`
	StatusCode        int               `json:"status_code"`
	AdditionalData    map[string]string `json:"additional_data"`
	S3Bucket          string            `json:"s3_bucket"`
	S3Key             string            `json:"s3_key"`
}
