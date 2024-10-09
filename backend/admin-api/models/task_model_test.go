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

	err = testDB.AutoMigrate(&Task{})
	require.NoError(t, err)

	db = testDB
	return testDB
}

func TestTaskStatusScan(t *testing.T) {
	var status TaskStatus
	err := status.Scan(int64(2))
	assert.NoError(t, err)
	assert.Equal(t, TaskStatusRunning, status)

	err = status.Scan("invalid")
	assert.Error(t, err)
}

func TestTaskStatusValue(t *testing.T) {
	status := TaskStatusComplete
	value, err := status.Value()
	assert.NoError(t, err)
	assert.Equal(t, int64(3), value)
}

func TestTaskStatusUnmarshalJSON(t *testing.T) {
	var status TaskStatus

	err := sonic.UnmarshalString("2", &status)
	assert.NoError(t, err)
	assert.Equal(t, TaskStatusRunning, status)

	err = sonic.UnmarshalString("5", &status)
	assert.Error(t, err)
}

func TestGetTasksByUserId(t *testing.T) {
	testDB := setupTestDB(t)
	defer testDB.Migrator().DropTable(&Task{})

	// Create test tasks
	testTasks := []Task{
		{Owner: "user1", TaskId: "task1", Status: TaskStatusCreated},
		{Owner: "user1", TaskId: "task2", Status: TaskStatusRunning},
		{Owner: "user2", TaskId: "task3", Status: TaskStatusComplete},
	}
	for _, task := range testTasks {
		err := testDB.Create(&task).Error
		require.NoError(t, err)
	}

	t.Run("Get tasks for existing user", func(t *testing.T) {
		tasks, err := GetTasksByUserId("user1")
		assert.NoError(t, err)
		assert.Len(t, tasks, 2)
		assert.Equal(t, "task1", tasks[0].TaskId)
		assert.Equal(t, "task2", tasks[1].TaskId)
	})

	t.Run("Get tasks for non-existing user", func(t *testing.T) {
		tasks, err := GetTasksByUserId("user3")
		assert.NoError(t, err)
		assert.Len(t, tasks, 0)
	})
}

func TestGetTaskById(t *testing.T) {
	testDB := setupTestDB(t)
	defer testDB.Migrator().DropTable(&Task{})

	// Create a test task
	testTask := Task{Owner: "user1", TaskId: "task1", Status: TaskStatusCreated}
	err := testDB.Create(&testTask).Error
	require.NoError(t, err)

	t.Run("Get existing task", func(t *testing.T) {
		task, err := GetTaskById(uint64(testTask.ID))
		assert.NoError(t, err)
		assert.Equal(t, testTask.ID, task.ID)
		assert.Equal(t, testTask.Owner, task.Owner)
		assert.Equal(t, testTask.TaskId, task.TaskId)
	})

	t.Run("Get non-existing task", func(t *testing.T) {
		task, err := GetTaskById(9999)
		assert.Error(t, err)
		assert.Nil(t, task)
	})
}

func TestCreateTask(t *testing.T) {
	testDB := setupTestDB(t)
	defer testDB.Migrator().DropTable(&Task{})

	task := Task{Owner: "user1", TaskId: "task1", Status: TaskStatusCreated}
	err := CreateTask(task)
	assert.NoError(t, err)

	// Verify the task was created
	var createdTask Task
	err = testDB.First(&createdTask, "task_id = ?", "task1").Error
	assert.NoError(t, err)
	assert.Equal(t, task.Owner, createdTask.Owner)
	assert.Equal(t, task.TaskId, createdTask.TaskId)
	assert.Equal(t, task.Status, createdTask.Status)
}

func TestUpdateTask(t *testing.T) {
	testDB := setupTestDB(t)
	defer testDB.Migrator().DropTable(&Task{})

	// Create a test task
	task := Task{Owner: "user1", TaskId: "task1", Status: TaskStatusCreated}
	err := testDB.Create(&task).Error
	require.NoError(t, err)

	// Update the task
	task.Status = TaskStatusRunning
	err = UpdateTask(task)
	assert.NoError(t, err)

	// Verify the task was updated
	var updatedTask Task
	err = testDB.First(&updatedTask, task.ID).Error
	assert.NoError(t, err)
	assert.Equal(t, TaskStatusRunning, updatedTask.Status)
}
