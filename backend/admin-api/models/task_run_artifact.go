package models

import (
	"time"

	"github.com/gocql/gocql"
)

type TaskRunArtifact struct {
	AirflowInstanceID gocql.UUID
	AirflowTaskID     gocql.UUID
	ArtifactID        gocql.UUID
	CreatedAt         time.Time
	ArtifactType      string
	URL               string
	ContentType       string
	ContentLength     int
	StatusCode        int
	S3Bucket          string
	S3Key             string
	AdditionalData    map[string]string
}

type TaskRunArtifactRepository struct {
	session *gocql.Session
}

func NewTaskRunArtifactRepository(session *gocql.Session) *TaskRunArtifactRepository {
	return &TaskRunArtifactRepository{session: session}
}

func (c *TaskRunArtifactRepository) Close() {
	c.session.Close()
}

func (c *TaskRunArtifactRepository) InsertArtifact(artifact *TaskRunArtifact) error {
	query := `
		INSERT INTO task_run_artifacts (
			airflow_instance_id, airflow_task_id, artifact_id, created_at, artifact_type, url, content_type, 
			content_length, status_code, s3_bucket, s3_key, additional_data
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`
	return c.session.Query(query,
		artifact.AirflowInstanceID, artifact.AirflowTaskID, artifact.ArtifactID, artifact.CreatedAt,
		artifact.ArtifactType, artifact.URL, artifact.ContentType, artifact.ContentLength,
		artifact.StatusCode, artifact.S3Bucket, artifact.S3Key, artifact.AdditionalData).Exec()
}

func (c *TaskRunArtifactRepository) ListArtifactsByTaskRunID(airflowInstanceId gocql.UUID, limit int, offset int) ([]*TaskRunArtifact, error) {
	var artifacts []*TaskRunArtifact
	query := `
		SELECT airflow_instance_id, airflow_task_id, artifact_id, created_at, artifact_type, url, content_type, 
			   content_length, status_code, s3_bucket, s3_key, additional_data
		FROM task_run_artifacts
		WHERE airflow_instance_id = ?
		ORDER BY created_at DESC, artifact_id DESC
		LIMIT ?
		OFFSET ?
	`
	iter := c.session.Query(query, airflowInstanceId, limit, offset).Iter()
	var artifact TaskRunArtifact
	for iter.Scan(
		&artifact.AirflowInstanceID, &artifact.AirflowTaskID, &artifact.ArtifactID, &artifact.CreatedAt,
		&artifact.ArtifactType, &artifact.URL, &artifact.ContentType, &artifact.ContentLength,
		&artifact.StatusCode, &artifact.S3Bucket, &artifact.S3Key, &artifact.AdditionalData) {
		artifacts = append(artifacts, &artifact)
	}
	if err := iter.Close(); err != nil {
		return nil, err
	}
	return artifacts, nil
}
