import { useState , useEffect} from 'react';
import { Button, DateInput , Input } from '@nextui-org/react';
import { Autocomplete, AutocompleteItem } from "@nextui-org/react";
import { CalendarDate } from "@internationalized/date";
import { useNavigate } from 'react-router-dom';
import { Chip } from "@nextui-org/react";



const TaskCreation = () => {
  // State for form fields

  const [isVisible, setIsVisible] = useState('block');

  const [sourceURL, setSourceURL] = useState('');

  const [outputFormat, setOutputFormat] = useState('');
  
  const variants = "faded";
  const form1 = [
    { label: "CSV", value: "CSV" },
    { label: "JSON", value: "JSON" },
    { label: "XML", value: "XML" }
  ];
  
  const today = new Date();
  const [startDate, setStartDate] = useState(
    new CalendarDate(today.getFullYear(), today.getMonth() + 1, today.getDate()) 
  );
  const [endDate, setEndDate] = useState(new CalendarDate(2055, 12, 31));

  const [frequency,setFrequency]=useState('')
  const [frequencyUnit,setFrequencyUnit]=useState('')

  const [keywords, setKeywords] = useState(['']);
  const [dataTypes, setDataTypes] = useState(['']);

  const previewButton = (e: React.FormEvent) => {
    e.preventDefault();
    const alertMessage = `Create task successfully!
    Source URL: ${sourceURL}
    Keywords: ${keywords}
    Data Types: ${dataTypes}
    Output Format: ${outputFormat}
    Start Date: ${startDate}
    End Date: ${endDate}
    Frequency: ${frequency}
    Frequency Unit: ${frequencyUnit}`;
    alert(alertMessage);
    // 后面的人看下这个，如果要调用数据
    //if you need Call date from this page , you may need this
    console.log('Before setting visibility to none:', isVisible);

    setIsVisible('none');

    console.log('After setting visibility to none:', isVisible);
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
    //add function forset datatypes and key words

    setKeywords([...keywords, '']); 
    setDataTypes([...dataTypes, '']); 
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

  const totalPagesScraped ="3 (need backend)"
  const pages='wait for backend'

    const modifyTask = () => {
      setIsVisible('block');
    }
    const navigate = useNavigate();
    const continueTask = () => {
      navigate('/home/task-management/ongoing');
    }
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

            <div>
              <div key={index} className="mb-4 flex space-x-4">
                {/* keyword Field */}
                <div className="mb-4">
                  <Input
                    type="text"
                    label="Keyword"
                    placeholder="e.g product_price"
                    value={keyword} 
                    onChange={(e) => handleKeywordChange(index, e.target.value)}  
                    style={{ backgroundColor: '#E5E7EB', color: '#1F2937' }} 
                  />
                </div>

                {/* datatype Field */}
                <div className="mb-4">
                <Autocomplete
                  id="dataType"
                  label="Data Type"
                  placeholder="Search or select a data type"
                  defaultItems={[
                    { label: "Text", value: "Text" },
                    { label: "Image", value: "Image" },
                    { label: "Table", value: "Table" }
                  ]}
                  onSelectionChange={(value) => handleDataTypeChange(index, value)}
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
                  onClick={()=>removeField(index)}
                  color="primary"
                  radius="full">
                  -
                </Button>
              </div>
            </div>
            ))}
          </div>
          {/*Output Format*/}
          <div className="mb-4">
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
                onChange={(date) => setStartDate(date)} 
                />
                
              </div>
          </div>  
          <div className="w-full flex flex-col gap-4 mb-4">
              <div key={variants} className="flex w-full flex-wrap md:flex-nowrap mb-6 md:mb-0 gap-4 mt-4">
                <DateInput variant={variants} label={"End date"} 
                placeholderValue={endDate}  
                value={endDate} 
                onChange={(date) => setEndDate(date)} 
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
                { label: "Days", value: "Days" },
                { label: "Hours", value: "Hours" },
                { label: "Weeks", value: "Weeks" }
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
          className="bg-gray-100 text-black p-2 rounded-lg w-full mb-4"
          style={{ backgroundColor: '#E5E7EB', color: '#1F2937' }}
        >{sourceURL}
        </div>
        <div>
        {/* 使用 map 方法遍历列表并渲染每个 Chip */}
          {keywords.map((item, index) => (
            <Chip 
              key={index}
              variant="bordered"
              color="primary"
              className="m-1">
                {item}
            </Chip>
          ))}
        </div>
        

        <div
          className="bg-gray-100 text-black p-2 rounded-lg w-full"
          style={{ backgroundColor: '#E5E7EB', color: '#1F2937' }}
        >
          {pages}
        </div>

        {/* page change button */}
        <div className="mt-4">
          <Button type="submit" className="w-36 bg-black text-white mr-4" onClick={modifyTask}>
            Modify Task
          </Button>
          <Button type="submit" className="w-36 bg-black text-white mr-4" onClick={continueTask}>
            Continue Task
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TaskCreation;
