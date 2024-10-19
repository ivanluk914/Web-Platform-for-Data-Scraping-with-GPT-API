import { useState , useEffect} from 'react';
import { Button, DateInput , Input, Spacer } from '@nextui-org/react';
import { Autocomplete, AutocompleteItem } from "@nextui-org/react";
import { CalendarDate } from "@internationalized/date";
import { useNavigate } from 'react-router-dom';
import { Chip } from "@nextui-org/react";
import { useAuth0 } from '@auth0/auth0-react';
import { toast } from 'react-hot-toast';
import { useHttp } from '../providers/http-provider';
import { validateURL, validateNonEmptyArray, validatePositiveInteger } from '../utils/validationUtils';

const TaskCreation = () => {
  // State for form fields
  const { user } = useAuth0();

  const [isVisible, setIsVisible] = useState('block');

  const [sourceURL, setSourceURL] = useState('');

  const [outputFormat, setOutputFormat] = useState('');
  
  const variants = "faded";
  const form1 = [
    { label: "CSV", value: "CSV" },
    { label: "JSON", value: "JSON" },
    { label: "Markdown", value: "Markdown" }
  ];
  
  const today = new Date();
  const [startDate, setStartDate] = useState<CalendarDate | null>(
    new CalendarDate(today.getFullYear(), today.getMonth() + 1, today.getDate())
  );
  const [endDate, setEndDate] = useState<CalendarDate | null>(
    new CalendarDate(today.getFullYear(), today.getMonth() + 1, today.getDate())
  );

  const [frequency,setFrequency]=useState('')
  const [frequencyUnit,setFrequencyUnit]=useState('')

  const [keywords, setKeywords] = useState(['']);
  const [dataTypes, setDataTypes] = useState(['']);
  const [content, setContent] = useState(''); // Add this line to define content state

  const axiosInstance = useHttp(); // get the axios instance from the http-provider

  const sendTaskToBackend = async () => {
    try {
      const response = await axiosInstance.post(`http://localhost:5001/api/${user?.sub}/task`, {
        sourceURL,
        keywords,
        dataTypes,
        outputFormat,
        startDate,
        endDate,
        frequency,
        frequencyUnit,
      });

      const data = response.data;
      console.log('Task sent successfully:', data);
      setContent(data.content); // Change data.content to data.gpt_response after buying GPT API
    } catch (error) {
      console.error('Error sending task to backend:', error);
    }
  };

  const previewButton = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation checks
    const areKeywordsFilled = validateNonEmptyArray(keywords);
    const areDataTypesFilled = validateNonEmptyArray(dataTypes);
    const isFrequencyValid = validatePositiveInteger(frequency);
    const isURLValid = validateURL(sourceURL);

    if (!sourceURL || !areKeywordsFilled || !areDataTypesFilled || !outputFormat || !startDate || !endDate || !frequency || !frequencyUnit) {
      toast.error('Please fill in all fields before proceeding.');
      return;
    }

    if (!isURLValid) {
      toast.error('Please enter a valid URL.');
      return;
    }

    if (!isFrequencyValid) {
      toast.error('Frequency must be a positive integer.');
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
    console.log('After setting visibility:', isVisible);
  }, [isVisible]);

    const modifyTask = () => {
      setIsVisible('block');
    }
    const navigate = useNavigate();
    const continueTask = async () => {
      try {
        const outputTypeMap = {
          JSON: 1, // OutputTypeJson
          CSV: 2,  // OutputTypeCsv
          GPT: 3,  // OutputTypeGpt
          Markdown: 4 // OutputTypeMarkdown
        };

        const periodMap = {
          Mins: 1,   // TaskPeriodHourly
          Hours: 2,  // TaskPeriodDaily
          Days: 3    // TaskPeriodWeekly
        };

        const taskDefinition = {
          source: [{ type: 1, url: sourceURL }], // Use the integer value for SourceTypeUrl
          target: keywords.map((keyword, index) => ({
            type: 1, // Use the integer value for TargetTypeAuto
            name: keyword,
            value: dataTypes[index]
          })),
          output: [{ type: outputTypeMap[outputFormat] }], // Map outputFormat to the correct integer
          period: periodMap[frequencyUnit],  // Ensure this is mapped to the correct integer

          // dateRange is not implemented in BE yet
          // dateRange: {
          //   start: startDate,
          //   end: endDate
          // }

        };

        const response = await axiosInstance.post(`http://localhost:8080/api/user/${user?.sub}/task`, taskDefinition);

        if (response.status === 201) {
          toast.success(`Task created successfully!`);
          localStorage.removeItem('hasCreatedTask');
          navigate('/home'); // path can be changed to /home/task-management/ongoing once implemented
        }
      } catch (error) {
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

  const handleDateChange = (setter: React.Dispatch<React.SetStateAction<CalendarDate | null>>) => (date: CalendarDate | null) => {
    if (date) {
      setter(date);
    } else {
      const defaultDate = new CalendarDate(today.getFullYear(), today.getMonth(), today.getDate());
      setter(defaultDate);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="bg-white p-8 rounded-lg shadow-md"  style={{ display: isVisible }}>
        {/* Title */}
        <h1 className="text-3xl font-bold mb-2 text-black">Task Creation</h1>
        {/* Description */}
        <p className="text-gray-900 mb-6">
          Create new scrapping job here.
        </p>

          {/* Source URL Field */}
          
          <div className="mb-4">
            <Input
              type="URL" 
              label="Source URL"
              placeholder="e.g https://abc.com.au"
              value={sourceURL} 
              onChange={(e) => setSourceURL(e.target.value)} 
              style={{ backgroundColor: '#E5E7EB', color: '#1F2937' }} 
            />
          </div>
          <div>
            {keywords.map((keyword, index) => (
              <div key={`keyword-${index}`}>
                <div className="mb-3 flex space-x-4">
                  {/* keyword Field */}
                  <div className="mb-1">
                    <Input
                      type="text"
                      label={index === 0 ? "Keyword" : ""}
                      placeholder="e.g product_price"
                      value={keyword} 
                      onChange={(e) => handleKeywordChange(index, e.target.value)}  
                      style={{ backgroundColor: '#E5E7EB', color: '#1F2937' }}
                      aria-label="Keyword"
                    />
                  </div>
                  {/* datatype Field */}
                  <div className="mb-1">
                    <Autocomplete
                      id="dataType"
                      label={index === 0 ? "Data Type" : ""}
                      placeholder="Search or select a data type"
                      defaultItems={[
                        { label: "Text", value: "Text" },
                        { label: "Image", value: "Image URL" },
                        { label: "Table", value: "Table" }
                      ]}
                      onSelectionChange={(value) => handleDataTypeChange(index, value)}
                      aria-label="Data Type"
                    >
                      {(item) => <AutocompleteItem key={item.label}>{item.label}</AutocompleteItem>}
                    </Autocomplete>
                  </div>
                  <Button
                    isIconOnly
                    type="button" 
                    onClick={addField} 
                    color="primary"
                    radius="full">
                    +
                  </Button>
                  <Button
                    isIconOnly
                    type="button" 
                    onClick={() => removeField(index)}
                    color="primary"
                    radius="full">
                    -
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="mb-4">
          </div>
          {/*Output Format*/}
          <div className="mb-1">
            <Autocomplete
              id="outputFormat"
              label="Output Format"
              placeholder="Search an output Format"
              className="max-w-xs"
              defaultItems={form1}
              onSelectionChange={(value) => setOutputFormat(value)} 
            >
              {(item) => <AutocompleteItem key={item.label}>{item.value}</AutocompleteItem>}
            </Autocomplete>

          </div>
          <div className="w-full flex flex-col gap-4">
              <div key={variants} className="flex w-full flex-wrap md:flex-nowrap mb-6 md:mb-0 gap-4 mt-4">
                <DateInput 
                variant={variants} label={"Start date"} 
                placeholderValue={startDate}  
                value={startDate} 
                onChange={handleDateChange(setStartDate)} 
                />
                
              </div>  
          </div>  
          <div className="w-full flex flex-col gap-4 mb-4">
              <div key={variants} className="flex w-full flex-wrap md:flex-nowrap mb-6 md:mb-0 gap-4 mt-4">
                <DateInput variant={variants} label={"End date"} 
                placeholderValue={endDate}  
                value={endDate} 
                onChange={handleDateChange(setEndDate)} 
                />
              </div>
     
          </div>  

          {/* frequency Field */}
          <div className="mb-4">
            <Input
              type="text" 
              label="Frequency"
              placeholder="e.g 5"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)} 
              style={{ backgroundColor: '#E5E7EB', color: '#1F2937' }}
            />
          </div>
          {/*Frequency Unit*/}
          <div className="mb-4">
            <Autocomplete
              label="Frequency Unit"
              placeholder="Search or select a Unit"
              defaultItems={[
                { label: "Mins", value: "Mins" },
                { label: "Hours", value: "Hours" },
                { label: "Days", value: "Days" }
              ]}
              onSelectionChange={(value) => setFrequencyUnit(value)}
            >
              {(item) => <AutocompleteItem key={item.value}>{item.label}</AutocompleteItem>}
            </Autocomplete>
          </div>

          {/* Update Profile Button */}
          <Button type="submit" className="w-36 bg-black text-white" onClick={previewButton}>
            Preview
          </Button>
      </div>
      <div className="bg-white p-8 rounded-lg shadow-md mb-4" style={{ display: isVisible === 'none' ? 'block' : 'none' }}>
        {/* Title */}
        <h1 className="text-3xl font-bold mb-2 text-black">Create Task Preview</h1>
        {/* Description */}
        <div
          className="bg-gray-100 text-black p-2 rounded-lg w-full mb-1"
          style={{ backgroundColor: '#E5E7EB', color: '#1F2937' }}
        >{sourceURL}
        </div>
        
        {keywords.length > 0 && keywords[0] !== '' && (
          <div>
            {/* 使用 map 方法历列表并渲染每个 Chip */}
            {keywords.map((item, index) => (
              <Chip 
                key={index}
                variant="bordered"
                color="primary"
                className="m-3.5"
              >
                {item}
              </Chip>
            ))}
          </div>
        )}
        {/* Output Format */}
        <div className="bg-gray-100 text-black p-2 rounded-lg w-full mb-4" style={{ backgroundColor: '#E5E7EB', color: '#1F2937' }}>
          <strong>Output Format:</strong> {outputFormat}
        </div>
          {/* Start Date End Date*/}
          <div className="bg-gray-100 text-black p-2 rounded-lg w-full mb-4" style={{ backgroundColor: '#E5E7EB', color: '#1F2937' }}>
            <strong>Start Date:</strong> {startDate?.toString()} <Spacer /> <strong>End Date:</strong> {endDate?.toString()}
          </div>
            {/* Frequency */}
  <div className="bg-gray-100 text-black p-2 rounded-lg w-full mb-4" style={{ backgroundColor: '#E5E7EB', color: '#1F2937' }}>
            <strong>Frequency:</strong> {frequency} {frequencyUnit}
          </div>

        <div className="mt-4">
          <div
            className="bg-gray-100 text-black p-2 rounded-lg w-full"
            style={{ backgroundColor: '#E5E7EB', color: '#1F2937' }}
          >
            {content ? content : 'No scrape result'}
          </div>
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
    </div>
  );
};

export default TaskCreation;
