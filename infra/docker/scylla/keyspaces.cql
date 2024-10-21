CREATE KEYSPACE scraper_metadata
    WITH replication = {'class': 'SimpleStrategy', 'replication_factor': '3'}
    AND durable_writes = true;

USE scraper_metadata;

CREATE TABLE task_run_artifacts (
    airflow_instance_id UUID,
    airflow_task_id UUID,
    artifact_id UUID,
    created_at TIMESTAMP,
    artifact_type TEXT,
    url TEXT,
    content_type TEXT,
    content_length INT,
    status_code INT,
    s3_bucket TEXT,
    s3_key TEXT,
    additional_data MAP<TEXT, TEXT>,
    PRIMARY KEY ((airflow_instance_id), artifact_id)
) WITH CLUSTERING ORDER BY (artifact_id DESC);

CREATE INDEX ON task_run_artifacts (task_id);