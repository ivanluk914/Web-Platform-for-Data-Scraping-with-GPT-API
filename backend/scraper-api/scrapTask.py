from flask import Flask, request, jsonify
import requests
from bs4 import BeautifulSoup
import os
from dotenv import load_dotenv
from flask_cors import CORS
import openai
import threading

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '../../.env'))

app = Flask(__name__)
CORS(app) 

openai.api_key = os.getenv('OPENAI_API_KEY')

def get_cleaned_text(url, keywords):
    """Receive URL, scrape, and return cleaned text and filtered image URLs in JSON."""
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.111 Safari/537.36'
    }
    response = requests.get(url, headers=headers)
    if response.status_code != 200:
        print(f"Failed to retrieve the page. Status code: {response.status_code}")
        return {"error": "Failed to retrieve the page."}, 500
    
    soup = BeautifulSoup(response.content, 'html.parser')
    
    image_urls = [
        img['src'] for img in soup.find_all('img') 
    ]
    
    for script in soup(["script", "style", "header", "footer", "nav", "aside"]):
        script.decompose()
    
    text = soup.get_text(separator="\n")
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    cleaned_text = "\n".join(lines)
    
    return {"content": cleaned_text, "images": image_urls}, 200

def extract_preview_response(gpt_response, outputFormat):
    """Extract the first three results from the GPT response based on the output format."""
    if outputFormat == 'JSON':
        # Split by the pattern that separates JSON objects
        results = gpt_response.split('},\\n    {')
    elif outputFormat == 'CSV':
        # Split by newlines, assuming each line is a result
        results = gpt_response.split('\\n')
    elif outputFormat == 'MARKDOWN':
        # Split by newlines, assuming each line is a result
        results = gpt_response.split('\\n')
    
    # Extract the first three results
    if outputFormat == 'MARKDOWN':
        preview_results = results[:5]
    elif outputFormat == 'JSON':
        preview_results = results[:3]
    elif outputFormat == 'CSV':
        preview_results = results[:4]
    
    # Join them back into a string
    if outputFormat == 'JSON':
        preview_response = '},\\n    {'.join(preview_results)
        preview_response += '}\\n}'
    else:
        preview_response = '\\n'.join(preview_results)
    
    return preview_response

def send_to_gpt_api(task_name, cleaned_text, image_urls, keywords, dataTypes, outputFormat):
    """Send the JSON to GPT and expect to get results from GPT."""
    try:
        if outputFormat == 'JSON':
            format_template = "{\\n" + ",\\n".join(
                ["    {\\n" + ",\\n".join([f'        "{keyword}": "[value{i+1}]"' for keyword in keywords]) + "\\n    }" for i in range(3)]
            ) + "\\n}"
        elif outputFormat == 'CSV':
            format_template = ",".join(keywords) + "\\n" + ",".join([f"[value{i+1}]" for i in range(len(keywords))]) + "\\n"
        elif outputFormat == 'MARKDOWN':
            format_template = "| " + " | ".join(keywords) + " |\\n" + "|------" * len(keywords) + "|\\n" + "| " + " | ".join([f"[value{i+1}]" for i in range(len(keywords))]) + " |\\n"

        if "Image URL" in dataTypes:
            gpt_model = "gpt-4o"
            max_tokens = 8000
            number = "7"
        else:
            gpt_model = "gpt-4o-mini-2024-07-18"
            max_tokens = 6000
            number = "20"
            
        prompt = f"""Task Name: {task_name}
        The task name provided by me sometimes are made up randomly which can be unrelated to the keywords and data. 
        From the data below, extract {number} matches for keywords: {keywords} in matching {dataTypes} order.
        Format the output exactly as shown below, including all \\n characters for newlines:

        {format_template}
        
        Use the {outputFormat} format and include all \\n characters exactly as shown.
        In your response, do not include any other text, including the word "{outputFormat}:" and \'\'\'.
        Only if there is no relevant data, return 'No data found'.
        Data: {cleaned_text}"""
        
        if "Image URL" in dataTypes:
            image_urls_text = "\n".join(image_urls)
            prompt += f"\nImage URLs: {image_urls_text}"
                
        response = openai.ChatCompletion.create(
            model=gpt_model, 
            messages=[
                {
                    "role": "system", 
                    "content": "You are a datascraper that formats data with explicit \\n characters for newlines. Never remove these characters."
                },
                {"role": "user", "content": prompt}
            ],
            max_tokens=max_tokens,
            timeout=80
        )
        
        gpt_response = response.choices[0].message.content.strip()

        if gpt_response == 'No data found' or gpt_response == 'No data found.':
            preview_response = gpt_response
        else:
            preview_response = extract_preview_response(gpt_response, outputFormat)

        # Full response for storage
        full_response = gpt_response

        return {"preview_response": preview_response, "full_response": full_response}, 200
    except Exception as e:
        print(f"Error communicating with GPT: {str(e)}")
        return {"error": f"Error communicating with GPT: {str(e)}"}, 500

def send_review_results_to_client(task_name, source_url, keywords, dataTypes, outputFormat):
    """Send results to the frontend."""
    # Step 1: Get cleaned text
    cleaned_text_result, status_code = get_cleaned_text(source_url, keywords)
    if status_code != 200:
        return jsonify(cleaned_text_result)

    # Step 2: Send to GPT
    gpt_result, status_code = send_to_gpt_api(task_name, cleaned_text_result["content"], cleaned_text_result["images"], keywords, dataTypes, outputFormat)
    if status_code != 200:
        return jsonify(gpt_result)

    # Step 3: Respond back to the frontend
    return jsonify({
        'message': 'Task received successfully',
        'cleaned_text': cleaned_text_result["content"],
        'keywords': keywords,
        'dataTypes': dataTypes,        
        'gpt_response': gpt_result["preview_response"],
        'gpt_full_response': gpt_result["full_response"],
        'outputFormat': outputFormat
    }), 200

@app.route('/api/<string:user_id>/task', methods=['POST'])
def scrap_task(user_id):
    data = request.json
    task_name = data.get('taskName')
    source_url = data.get('sourceURL')
    keywords = data.get('keywords')
    outputFormat = data.get('outputFormat')
    dataTypes = data.get('dataTypes')
    print(f"Preview request from user {user_id}: taskName={task_name}, sourceURL={source_url}, keywords={keywords}, outputFormat={outputFormat}, dataTypes={dataTypes}")
    return send_review_results_to_client(task_name, source_url, keywords, dataTypes, outputFormat)  

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)     