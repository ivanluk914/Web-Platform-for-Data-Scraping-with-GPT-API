package models

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupTestDBForTaskRun(t *testing.T) *gorm.DB {
	testDB, err := gorm.Open(sqlite.Open("file::memory:?cache=shared"), &gorm.Config{})
	require.NoError(t, err)

	err = testDB.AutoMigrate(&TaskRun{})
	require.NoError(t, err)

	db = testDB
	return testDB
}

func TestListRunsForTask(t *testing.T) {
	testDB := setupTestDBForTaskRun(t)
	defer testDB.Migrator().DropTable(&TaskRun{})

	// Create test task runs
	testRuns := []TaskRun{
		{TaskID: 1, Status: TaskStatusCreated, StartTime: time.Now(), EndTime: time.Now().Add(time.Hour)},
		{TaskID: 1, Status: TaskStatusRunning, StartTime: time.Now().Add(-time.Hour), EndTime: time.Now()},
		{TaskID: 2, Status: TaskStatusComplete, StartTime: time.Now().Add(-2 * time.Hour), EndTime: time.Now().Add(-time.Hour)},
	}
	for _, run := range testRuns {
		err := testDB.Create(&run).Error
		require.NoError(t, err)
	}

	t.Run("List runs for existing task", func(t *testing.T) {
		runs, err := ListRunsForTask(1)
		assert.NoError(t, err)
		assert.Len(t, runs, 2)
		assert.Equal(t, TaskStatusCreated, runs[0].Status)
		assert.Equal(t, TaskStatusRunning, runs[1].Status)
	})

	t.Run("List runs for non-existing task", func(t *testing.T) {
		runs, err := ListRunsForTask(999)
		assert.NoError(t, err)
		assert.Len(t, runs, 0)
	})
}

func TestGetTaskRun(t *testing.T) {
	testDB := setupTestDBForTaskRun(t)
	defer testDB.Migrator().DropTable(&TaskRun{})

	testRun := TaskRun{
		TaskID:            1,
		AirflowInstanceID: "airflow-1",
		Status:            TaskStatusRunning,
		StartTime:         time.Now(),
		EndTime:           time.Now().Add(time.Hour),
		ErrorMessage:      "",
	}
	err := testDB.Create(&testRun).Error
	require.NoError(t, err)

	t.Run("Get existing task run", func(t *testing.T) {
		run, err := GetTaskRun(uint64(testRun.ID))
		assert.NoError(t, err)
		assert.NotNil(t, run)
		assert.Equal(t, testRun.TaskID, run.TaskID)
		assert.Equal(t, testRun.AirflowInstanceID, run.AirflowInstanceID)
		assert.Equal(t, testRun.Status, run.Status)
	})

	t.Run("Get non-existing task run", func(t *testing.T) {
		run, err := GetTaskRun(999)
		assert.Error(t, err)
		assert.Nil(t, run)
		assert.Contains(t, err.Error(), "task not found")
	})
}

func TestGetLatestRunForTask(t *testing.T) {
	testDB := setupTestDBForTaskRun(t)
	defer testDB.Migrator().DropTable(&TaskRun{})

	// Create test task runs
	testRuns := []TaskRun{
		{TaskID: 1, Status: TaskStatusComplete, StartTime: time.Now().Add(-2 * time.Hour), EndTime: time.Now().Add(-time.Hour)},
		{TaskID: 1, Status: TaskStatusRunning, StartTime: time.Now().Add(-time.Hour), EndTime: time.Now()},
		{TaskID: 2, Status: TaskStatusFailed, StartTime: time.Now().Add(-3 * time.Hour), EndTime: time.Now().Add(-2 * time.Hour)},
	}
	for _, run := range testRuns {
		err := testDB.Create(&run).Error
		require.NoError(t, err)
	}

	t.Run("Get latest run for existing task", func(t *testing.T) {
		run, err := GetLatestRunForTask(1)
		assert.NoError(t, err)
		assert.NotNil(t, run)
		assert.Equal(t, TaskStatusRunning, run.Status)
	})

	t.Run("Get latest run for non-existing task", func(t *testing.T) {
		run, err := GetLatestRunForTask(999)
		assert.NoError(t, err)
		assert.Nil(t, run)
	})
}

func TestCreateTaskRun(t *testing.T) {
	testDB := setupTestDBForTaskRun(t)
	defer testDB.Migrator().DropTable(&TaskRun{})

	taskRun := TaskRun{
		TaskID:            1,
		AirflowInstanceID: "airflow-1",
		Status:            TaskStatusCreated,
		StartTime:         time.Now(),
		EndTime:           time.Now().Add(time.Hour),
		ErrorMessage:      "",
	}

	createdTaskRun, err := CreateTaskRun(taskRun)
	assert.NoError(t, err)
	assert.NotNil(t, createdTaskRun)

	// Verify the task run was created
	var createdRun TaskRun
	err = testDB.First(&createdRun, "task_id = ? AND airflow_instance_id = ?", taskRun.TaskID, taskRun.AirflowInstanceID).Error
	assert.NoError(t, err)
	assert.Equal(t, taskRun.TaskID, createdRun.TaskID)
	assert.Equal(t, taskRun.AirflowInstanceID, createdRun.AirflowInstanceID)
	assert.Equal(t, taskRun.Status, createdRun.Status)
}

func TestUpdateTaskRun(t *testing.T) {
	testDB := setupTestDBForTaskRun(t)
	defer testDB.Migrator().DropTable(&TaskRun{})

	// Create a test task run
	taskRun := TaskRun{
		TaskID:            1,
		AirflowInstanceID: "airflow-1",
		Status:            TaskStatusCreated,
		StartTime:         time.Now(),
		EndTime:           time.Now().Add(time.Hour),
		ErrorMessage:      "",
	}
	err := testDB.Create(&taskRun).Error
	require.NoError(t, err)

	// Update the task run
	taskRun.Status = TaskStatusComplete
	taskRun.EndTime = time.Now().Add(2 * time.Hour)
	taskRun.ErrorMessage = "Completed successfully"

	updatedTaskRun, err := UpdateTaskRun(taskRun)
	assert.NoError(t, err)
	assert.NotNil(t, updatedTaskRun)

	// Verify the task run was updated
	var updatedRun TaskRun
	err = testDB.First(&updatedRun, taskRun.ID).Error
	assert.NoError(t, err)
	assert.Equal(t, TaskStatusComplete, updatedRun.Status)
	assert.Equal(t, taskRun.EndTime.Unix(), updatedRun.EndTime.Unix())
	assert.Equal(t, "Completed successfully", updatedRun.ErrorMessage)
}
