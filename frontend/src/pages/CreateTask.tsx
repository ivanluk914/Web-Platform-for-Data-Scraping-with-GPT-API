import { useState , useEffect} from 'react';
import { Button, Card, CardBody, Input } from '@nextui-org/react';
import { Autocomplete, AutocompleteItem } from "@nextui-org/react";
import { useNavigate } from 'react-router-dom';
import { Chip } from "@nextui-org/react";
import { useAuth0 } from '@auth0/auth0-react';
import { toast } from 'react-hot-toast';
import { useHttp } from '../providers/http-provider';
import { validateURL, validateNonEmptyArray, validatePositiveInteger } from '../utils/validationUtils';
import { outputTypeMap, periodMap, TaskPeriod, TargetType } from '../models/task';
import { FiTrash2, FiPlus } from 'react-icons/fi';

const TaskCreation = () => {
  // State for form fields
  const { user } = useAuth0();
  const [taskName, setTaskName] = useState('');
  const [isVisible, setIsVisible] = useState('block');
  const [sourceURL, setSourceURL] = useState('');
  const [outputFormat, setOutputFormat] = useState('');
  const form1 = [
    { label: "CSV", value: "CSV" },
    { label: "JSON", value: "JSON" },
    { label: "MARKDOWN", value: "MARKDOWN" }
  ];

  const [keywords, setKeywords] = useState(['']);
  const [dataTypes, setDataTypes] = useState(['']);
  const [content, setContent] = useState('');
  const [GPTResponse, setGPTResponse] = useState('');
  const [fullResponse, setFullResponse] = useState('');
  const [canCreateTask, setCanCreateTask] = useState(false);
  const [taskRunType, setTaskRunType] = useState<TaskPeriod>(TaskPeriod.Unknown);

  const http = useHttp(); // Use the useHttp hook

  const sendTaskToBackend = async () => {
    try {
      const response = await http.post(`http://localhost:5001/api/${user?.sub}/task`, {
        taskName,
        sourceURL,
        keywords,
        dataTypes,
        outputFormat,
      });

      const data = response.data;
      // console.log('data', data);
      if (data.error) {
        console.error('Error from backend:', data.error);
        if (data.error === "Error communicating with GPT: Error communicating with OpenAI: ('Connection aborted.', RemoteDisconnected('Remote end closed connection without response'))") {
          setContent('🚫 Oops! The website is too big for us to scrape. Please try a different URL or reduce the number of keywords.');
        } else {
          setContent('🚫 Oops! They seem to know we are scraping them. Please check the URL and try again.');
        }
        setCanCreateTask(false);
        return;
      }
      // console.log('GPT response:', data.gpt_response);
      if (data.gpt_response === 'No data found' || data.gpt_response === 'No data found.') {
        setContent('🔍 No data found, please try again');
        setCanCreateTask(false);
      } else {
        // First replace escaped newlines, then replace actual newlines
        const formattedResponse = data.gpt_response
          .replace(/\\n/g, '\n')
          .replace(/\n/g, '\n');
        setGPTResponse(data.gpt_response);
        setFullResponse(data.gpt_full_response);
        setContent(formattedResponse);
        setCanCreateTask(true);
      }
    } catch (error) {
      console.error('Error sending task to backend:', error);
      toast.error('An error occurred while sending the task. Please try again.');
      setCanCreateTask(false);
    }
  };

  const previewButton = (e: React.FormEvent) => {
    e.preventDefault();

    // Reset content to loading state before making the request
    setContent('🔍 Extracting data...');
    // Validation checks
    const areKeywordsFilled = validateNonEmptyArray(keywords);
    const areDataTypesFilled = validateNonEmptyArray(dataTypes);
    const isURLValid = validateURL(sourceURL);
    
    if (taskName === '' || !sourceURL || !areKeywordsFilled || !areDataTypesFilled || !outputFormat || !taskRunType) {
    toast.error('Please fill in all required fields before proceeding.');
      return;
    }

    if (!isURLValid) {
      toast.error('Please enter a valid URL.');
      return;
    }

    sendTaskToBackend();
    setIsVisible('none');
  };


  const handleKeywordChange = (index: number, value: string) => {
    const updatedKeywords = [...keywords];
    updatedKeywords[index] = value;
    setKeywords(updatedKeywords);
  };

  const handleDataTypeChange = (index: number, value: string) => {
    const updatedDataTypes = [...dataTypes];
    updatedDataTypes[index] = value; 
    setDataTypes(updatedDataTypes);
  };

  const addField = () => {
    // Ensure existing keywords and dataTypes are preserved
    setKeywords((prevKeywords) => [...prevKeywords, '']);
    setDataTypes((prevDataTypes) => [...prevDataTypes, '']);
  };
  
  const removeField = (index: number) => {
    //del function forset datatypes and key words
    if (keywords.length > 1 && dataTypes.length > 1) {
      const updatedKeywords = [...keywords];
      const updatedDataTypes = [...dataTypes];
      
      updatedKeywords.splice(index, 1);
      updatedDataTypes.splice(index, 1);
    
      setKeywords(updatedKeywords);
      setDataTypes(updatedDataTypes);
    }
  };

// preview page 
  useEffect(() => {
  }, [isVisible]);

    const modifyTask = () => {
      setIsVisible('block');
    }
    const navigate = useNavigate();
    const continueTask = async () => {
      if (!canCreateTask) {
        toast.error('Cannot create task due to previous errors.');
        return;
      }
      try {
        const taskDefinition = {
          type: taskRunType, // TaskRunType: {1: Single, 2: Minute, 3: Hourly, 4: Daily, 5: Weekly, 6: Monthly}
          source: [{ type: 1, url: sourceURL }],
          target: keywords.map((keyword, index) => ({
            type: 1, // Auto Target for now
            name: keyword,
            value: dataTypes[index]
          })),
          output: [
            {
              type: outputTypeMap[outputFormat],
              name: "preview",
              value: GPTResponse
            },
            {
              type: outputTypeMap[outputFormat],
              name: "full",
              value: fullResponse
            }
          ],
          period: taskRunType
        };

        const TaskDetails = {
          task_definition: taskDefinition,
          task_name: taskName,
          deleted_at: null,
          status: 1,
        };

        const response = await http.post(`/user/${user?.sub}/task`, TaskDetails);
        // console.log('task details', TaskDetails);
        const taskId = response.data.ID;
        if (response.status === 201) {
          toast.success(`Task created successfully!`);
          localStorage.removeItem('hasCreatedTask');
          if (taskRunType === TaskPeriod.Single) {
            TaskDetails.status = 3;
            await http.put(`/user/${user?.sub}/task/${taskId}`, TaskDetails);
          } else {
            // TODO:create schedule
            TaskDetails.status = 1;
          }
          http.put(`http://localhost:5001/api/${user?.sub}/task/${taskId}/summary`, { TaskDetails });
          navigate('/home');
        }
      } catch (error: any) {
        console.error('Error creating task:', error);
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.error(error.response.data);
          console.error(error.response.status);
          console.error(error.response.headers);
        } else if (error.request) {
          // The request was made but no response was received
          console.error(error.request);
        } else {
          // Something happened in setting up the request that triggered an Error
          console.error('Error', error.message);
        }
        toast.error('Failed to create task. Please try again.');
      }
    };

  return (
    <div className="container mx-auto">
      <Card className="mx-auto max-w-2xl">
        <CardBody className="p-8">
        <div style={{ display: isVisible }}>
          {/* Updated Title and Description styling */}
          <h1 className="text-3xl font-bold mb-2 text-black">Task Creation</h1>
          <p className="text-gray-600 mb-6">
            Create a new data extraction task by specifying the source URL and data requirements.
          </p>

          {/* Task Name Field */}
          <div className="mb-5">
            <Input
              type="text"
              label="Task Name"
              placeholder="Enter task name"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              style={{ backgroundColor: '#E5E7EB', color: '#1F2937' }}
            />
          </div>

          {/* Source URL Field */}
          <div className="mb-5">
            <Input
              type="URL" 
              label="Source URL"
              placeholder="e.g https://abc.com.au"
              value={sourceURL} 
              onChange={(e) => setSourceURL(e.target.value)} 
              style={{ backgroundColor: '#E5E7EB', color: '#1F2937' }} 
            />
          </div>
          <div className="space-y-3">
            {/* Keyword/DataType Rows */}
            {keywords.map((keyword, index) => (
              <div key={`keyword-${index}`} className="flex items-center gap-4">
                <div className="flex-grow grid grid-cols-2 gap-4">
                  <Input
                    type="text"
                    label={index === 0 ? "Keyword" : ""}
                    placeholder="e.g Product Price"
                    value={keyword}
                    onChange={(e) => handleKeywordChange(index, e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Autocomplete
                      id="dataType"
                      className="flex-grow"
                      label={index === 0 ? "Data Type" : ""}
                      placeholder="Select a data type"
                      defaultItems={[
                        { label: "Text", value: "Text" },
                        { label: "Image URL", value: "Image URL" },
                        { label: "Table", value: "Table" }
                      ]}
                      onSelectionChange={(value) => handleDataTypeChange(index, value)}
                    >
                      {(item) => <AutocompleteItem key={item.label}>{item.label}</AutocompleteItem>}
                    </Autocomplete>
                    {keywords.length > 1 && (
                      <Button
                        isIconOnly
                        type="button"
                        onClick={() => removeField(index)}
                        className="min-w-unit-8 h-unit-8 self-end mb-2"
                        size="sm"
                        variant="light"
                        color="danger"
                      >
                        <FiTrash2 size={18} />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Add New Button */}
            <Button
              type="button"
              onClick={addField}
              variant="flat"
              className="w-full mt-4"
              startContent={<FiPlus size={18} />}
            >
              Add New Field
            </Button>
          </div>
          <div className="mb-5">
          </div>
          {/*Output Format*/}
          <div className="mb-5">
            <Autocomplete
              id="outputFormat"
              label="Output Format"
              placeholder="Select an output format"
              className="max-w-xs"
              defaultItems={form1}
              onSelectionChange={(value) => setOutputFormat(value)} 
            >
              {(item) => <AutocompleteItem key={item.label}>{item.value}</AutocompleteItem>}
            </Autocomplete>

          </div>

          {/* Task Run Type Field */}
        <div className="mb-4">
          <Autocomplete
            label="Task Run Type"
            placeholder="Select task run type"
            defaultItems={[
              { label: "Single", value: "Single" },
              { label: "Minutely", value: "Minutely" },
              { label: "Hourly", value: "Hourly" },
              { label: "Daily", value: "Daily" },
              { label: "Weekly", value: "Weekly" },
              { label: "Monthly", value: "Monthly" }
            ]}
            onSelectionChange={(value) => setTaskRunType(periodMap[value as string])}
          >
            {(item) => <AutocompleteItem key={item.value}>{item.label}</AutocompleteItem>}
          </Autocomplete>
        </div>  

          {/* Update Profile Button */}
          <Button type="submit" className="w-36 bg-black text-white" onClick={previewButton}>
            Preview
          </Button>
      </div>
      <div style={{ display: isVisible === 'none' ? 'block' : 'none' }}>
        {/* Title */}
        <h1 className="text-3xl font-bold mb-2 text-black">Create Task Preview</h1>
        {/* Description */}
        <p className="text-blue-600 mb-4">
          Note: Preview shows up to 3 results. The full task will extract all matching data.
        </p>
        
        <div
          className="bg-gray-100 text-black p-2 rounded-lg w-full mb-3"
          style={{ backgroundColor: '#E5E7EB', color: '#1F2937' }}
        ><strong>Task Name: </strong>{taskName}
        </div>

        {/* Source URL */}
        <div
          className="bg-gray-100 text-black p-2 rounded-lg w-full mb-3"
          style={{ backgroundColor: '#E5E7EB', color: '#1F2937' }}
        ><strong>Source URL: </strong>{sourceURL}
        </div>
        
        {keywords.length > 0 && keywords[0] !== '' && (
          <div>
          <div className="bg-gray-100 text-black p-1 rounded-lg w-full mb-3" style={{ backgroundColor: '#E5E7EB', color: '#1F2937' }}>
          <strong>Keywords:</strong>
            {keywords.map((item, index) => (
              <Chip 
                key={index}
                variant="flat"
                color="primary"
                className="m-2"
              >
                {item}
              </Chip>
            ))}
          </div>
          </div>
        )}
        {/* Output Format */}
        <div className="bg-gray-100 text-black p-2 rounded-lg w-full mb-4" style={{ backgroundColor: '#E5E7EB', color: '#1F2937' }}>
          <strong>Output Format:</strong> {outputFormat}
        </div>
          {/* Task Run Type */}
          <div className="bg-gray-100 text-black p-2 rounded-lg w-full mb-4" style={{ backgroundColor: '#E5E7EB', color: '#1F2937' }}>
            <strong>Task Run Type:</strong> {TaskPeriod[taskRunType]}
          </div>

        <div className="mt-4">
          <pre
            className="bg-gray-100 text-black p-2 rounded-lg w-full whitespace-pre-wrap"
            style={{ 
              backgroundColor: '#E5E7EB', 
              color: '#1F2937',
              fontFamily: 'inherit'
            }}
          >
            {content ? <pre className="whitespace-pre-wrap text-sm">{content}</pre> : '🔍 Extracting data...'}
          </pre>
        </div>

        {/* page change button */}
        <div className="mt-4">
          <Button type="submit" className="w-36 bg-black text-white mr-4" onClick={modifyTask}>
            Modify Task
          </Button>
          <Button type="submit" className="w-36 bg-black text-white mr-4" onClick={continueTask}>
            Create Task
          </Button>
        </div>
      </div>
      </CardBody>
      </Card>
    </div>
);
};

export default TaskCreation;