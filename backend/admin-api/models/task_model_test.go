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

func TestGetTasksByUserId(t *testing.T) {
	testDB := setupTestDB(t)
	defer testDB.Migrator().DropTable(&Task{})

	// Create test tasks
	testTasks := []Task{
		{Owner: "user1", AirflowTaskId: "task1"},
		{Owner: "user1", AirflowTaskId: "task2"},
		{Owner: "user2", AirflowTaskId: "task3"},
	}
	for _, task := range testTasks {
		err := testDB.Create(&task).Error
		require.NoError(t, err)
	}

	t.Run("Get tasks for existing user", func(t *testing.T) {
		tasks, err := GetTasksByUserId("user1")
		assert.NoError(t, err)
		assert.Len(t, tasks, 2)
		assert.Equal(t, "task1", tasks[0].AirflowTaskId)
		assert.Equal(t, "task2", tasks[1].AirflowTaskId)
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

	taskDef := TaskDefinition{
		Type: TaskRunTypePreview,
		Source: []UrlSource{
			{Type: SourceTypeUrl, URL: "https://example.com"},
		},
		Target: []Target{
			{Type: TargetTypeAuto, Value: "some_value"},
		},
		Output: []Output{
			{Type: OutputTypeJson},
		},
		Period: TaskPeriodDaily,
	}
	taskDefJSON, err := sonic.Marshal(taskDef)
	require.NoError(t, err)

	testTask := Task{
		Owner:          "user1",
		TaskName:       "Test Task",
		TaskDefinition: taskDefJSON,
		AirflowTaskId:  "task1",
	}
	err = testDB.Create(&testTask).Error
	require.NoError(t, err)

	t.Run("Get existing task", func(t *testing.T) {
		task, err := GetTaskById(uint64(testTask.ID))
		assert.NoError(t, err)
		assert.Equal(t, testTask.ID, task.ID)
		assert.Equal(t, testTask.Owner, task.Owner)
		assert.Equal(t, testTask.TaskName, task.TaskName)
		assert.Equal(t, testTask.AirflowTaskId, task.AirflowTaskId)
		assert.JSONEq(t, string(testTask.TaskDefinition), string(task.TaskDefinition))
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

	taskDef := TaskDefinition{
		Type: TaskRunTypeSingle,
		Source: []UrlSource{
			{Type: SourceTypeUrl, URL: "https://example.com"},
		},
		Target: []Target{
			{Type: TargetTypeXpath, Name: "title", Value: "//h1"},
		},
		Output: []Output{
			{Type: OutputTypeCsv},
		},
		Period: TaskPeriodUnknown,
	}
	taskDefJSON, err := sonic.Marshal(taskDef)
	require.NoError(t, err)

	task := Task{
		Owner:          "user1",
		TaskName:       "New Task",
		TaskDefinition: taskDefJSON,
		AirflowTaskId:  "task1",
	}
	err = CreateTask(task)
	assert.NoError(t, err)

	// Verify the task was created
	var createdTask Task
	err = testDB.First(&createdTask, "airflow_task_id = ?", "task1").Error
	assert.NoError(t, err)
	assert.Equal(t, task.Owner, createdTask.Owner)
	assert.Equal(t, task.TaskName, createdTask.TaskName)
	assert.Equal(t, task.AirflowTaskId, createdTask.AirflowTaskId)
	assert.JSONEq(t, string(task.TaskDefinition), string(createdTask.TaskDefinition))
}

func TestUpdateTask(t *testing.T) {
	testDB := setupTestDB(t)
	defer testDB.Migrator().DropTable(&Task{})

	// Create a test task
	taskDef := TaskDefinition{
		Type: TaskRunTypePeriodic,
		Source: []UrlSource{
			{Type: SourceTypeUrl, URL: "https://example.com"},
		},
		Target: []Target{
			{Type: TargetTypeQuery, Name: "price", Value: ".price"},
		},
		Output: []Output{
			{Type: OutputTypeGpt, Value: "Summarize the prices"},
		},
		Period: TaskPeriodWeekly,
	}
	taskDefJSON, err := sonic.Marshal(taskDef)
	require.NoError(t, err)

	task := Task{
		Owner:          "user1",
		TaskName:       "Original Task",
		TaskDefinition: taskDefJSON,
		AirflowTaskId:  "task1",
	}
	err = testDB.Create(&task).Error
	require.NoError(t, err)

	// Update the task
	task.TaskName = "Updated Task"
	taskDef.Period = TaskPeriodDaily
	taskDefJSON, err = sonic.Marshal(taskDef)
	require.NoError(t, err)
	task.TaskDefinition = taskDefJSON

	err = UpdateTask(task)
	assert.NoError(t, err)

	// Verify the task was updated
	var updatedTask Task
	err = testDB.First(&updatedTask, task.ID).Error
	assert.NoError(t, err)
	assert.Equal(t, "Updated Task", updatedTask.TaskName)
	assert.JSONEq(t, string(taskDefJSON), string(updatedTask.TaskDefinition))
}

// Add new test for TaskDefinition
func TestTaskDefinition(t *testing.T) {
	td := TaskDefinition{
		Type: TaskRunTypePreview,
		Source: []UrlSource{
			{Type: SourceTypeUrl, URL: "https://example.com"},
		},
		Target: []Target{
			{Type: TargetTypeAuto, Value: "some_value"},
			{Type: TargetTypeXpath, Name: "title", Value: "//h1"},
			{Type: TargetTypeQuery, Name: "price", Value: ".price"},
		},
		Output: []Output{
			{Type: OutputTypeJson},
			{Type: OutputTypeCsv},
			{Type: OutputTypeGpt, Value: "Summarize the content"},
			{Type: OutputTypeMarkdown},
		},
		Period: TaskPeriodDaily,
	}

	assert.Equal(t, TaskRunTypePreview, td.Type)
	assert.Len(t, td.Source, 1)
	assert.Len(t, td.Target, 3)
	assert.Len(t, td.Output, 4)
	assert.Equal(t, TaskPeriodDaily, td.Period)

	// Test JSON marshaling and unmarshaling
	jsonData, err := sonic.Marshal(td)
	assert.NoError(t, err)

	var unmarshaledTD TaskDefinition
	err = sonic.Unmarshal(jsonData, &unmarshaledTD)
	assert.NoError(t, err)

	assert.Equal(t, td, unmarshaledTD)
}
