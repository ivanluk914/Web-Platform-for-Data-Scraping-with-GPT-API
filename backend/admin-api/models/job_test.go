package models

import (
	"testing"

	"github.com/bytedance/sonic"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupTestDB(t *testing.T) *gorm.DB {
	testDB, err := gorm.Open(sqlite.Open("file::memory:?cache=shared"), &gorm.Config{})
	require.NoError(t, err)

	err = testDB.AutoMigrate(&Job{})
	require.NoError(t, err)

	db = testDB
	return testDB
}

func TestJobStatusScan(t *testing.T) {
	var status JobStatus
	err := status.Scan(int64(2))
	assert.NoError(t, err)
	assert.Equal(t, JobStatusRunning, status)

	err = status.Scan("invalid")
	assert.Error(t, err)
}

func TestJobStatusValue(t *testing.T) {
	status := JobStatusComplete
	value, err := status.Value()
	assert.NoError(t, err)
	assert.Equal(t, int64(3), value)
}

func TestJobStatusUnmarshalJSON(t *testing.T) {
	var status JobStatus

	err := sonic.UnmarshalString("2", &status)
	assert.NoError(t, err)
	assert.Equal(t, JobStatusRunning, status)

	err = sonic.UnmarshalString("5", &status)
	assert.Error(t, err)
}

func TestGetJobsByUserId(t *testing.T) {
	testDB := setupTestDB(t)
	defer testDB.Migrator().DropTable(&Job{})

	// Create test jobs
	testJobs := []Job{
		{Owner: "user1", TaskId: "task1", Status: JobStatusCreated},
		{Owner: "user1", TaskId: "task2", Status: JobStatusRunning},
		{Owner: "user2", TaskId: "task3", Status: JobStatusComplete},
	}
	for _, job := range testJobs {
		err := testDB.Create(&job).Error
		require.NoError(t, err)
	}

	t.Run("Get jobs for existing user", func(t *testing.T) {
		jobs, err := GetJobsByUserId("user1")
		assert.NoError(t, err)
		assert.Len(t, jobs, 2)
		assert.Equal(t, "task1", jobs[0].TaskId)
		assert.Equal(t, "task2", jobs[1].TaskId)
	})

	t.Run("Get jobs for non-existing user", func(t *testing.T) {
		jobs, err := GetJobsByUserId("user3")
		assert.NoError(t, err)
		assert.Len(t, jobs, 0)
	})
}

func TestGetJobById(t *testing.T) {
	testDB := setupTestDB(t)
	defer testDB.Migrator().DropTable(&Job{})

	// Create a test job
	testJob := Job{Owner: "user1", TaskId: "task1", Status: JobStatusCreated}
	err := testDB.Create(&testJob).Error
	require.NoError(t, err)

	t.Run("Get existing job", func(t *testing.T) {
		job, err := GetJobById(uint64(testJob.ID))
		assert.NoError(t, err)
		assert.Equal(t, testJob.ID, job.ID)
		assert.Equal(t, testJob.Owner, job.Owner)
		assert.Equal(t, testJob.TaskId, job.TaskId)
	})

	t.Run("Get non-existing job", func(t *testing.T) {
		job, err := GetJobById(9999)
		assert.Error(t, err)
		assert.Nil(t, job)
	})
}

func TestCreateJob(t *testing.T) {
	testDB := setupTestDB(t)
	defer testDB.Migrator().DropTable(&Job{})

	job := Job{Owner: "user1", TaskId: "task1", Status: JobStatusCreated}
	err := CreateJob(job)
	assert.NoError(t, err)

	// Verify the job was created
	var createdJob Job
	err = testDB.First(&createdJob, "task_id = ?", "task1").Error
	assert.NoError(t, err)
	assert.Equal(t, job.Owner, createdJob.Owner)
	assert.Equal(t, job.TaskId, createdJob.TaskId)
	assert.Equal(t, job.Status, createdJob.Status)
}

func TestUpdateJob(t *testing.T) {
	testDB := setupTestDB(t)
	defer testDB.Migrator().DropTable(&Job{})

	// Create a test job
	job := Job{Owner: "user1", TaskId: "task1", Status: JobStatusCreated}
	err := testDB.Create(&job).Error
	require.NoError(t, err)

	// Update the job
	job.Status = JobStatusRunning
	err = UpdateJob(job)
	assert.NoError(t, err)

	// Verify the job was updated
	var updatedJob Job
	err = testDB.First(&updatedJob, job.ID).Error
	assert.NoError(t, err)
	assert.Equal(t, JobStatusRunning, updatedJob.Status)
}
