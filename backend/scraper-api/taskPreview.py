from flask import Flask, request, jsonify
import requests
from bs4 import BeautifulSoup
import openai
import os
from dotenv import load_dotenv
from flask_cors import CORS

# Load environment variables from .env file in the root directory
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '../../.env'))

app = Flask(__name__)
CORS(app)  # This will enable CORS for all routes

# Set your OpenAI API key
openai.api_key = os.getenv('OPENAI_API_KEY')

def get_cleaned_text(url):
    """Receive URL, scrape, and return cleaned text in JSON."""
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.111 Safari/537.36'
    }
    response = requests.get(url, headers=headers)
    if response.status_code != 200:
        print(f"Failed to retrieve the page. Status code: {response.status_code}")
        return {"error": "Failed to retrieve the page."}, 500
    
    soup = BeautifulSoup(response.content, 'html.parser')
    for script in soup(["script", "style", "header", "footer", "nav", "aside"]):
        script.decompose()
    
    text = soup.get_text(separator="\n")
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    cleaned_text = "\n".join(lines)
    
    return {"content": cleaned_text}, 200

def send_to_gpt_api(cleaned_text, keywords, dataTypes, outputFormat):
    """Send the JSON to GPT and expect to get results from GPT."""
    try:
        prompt = f"From the data below, respond with keywords: {keywords} in matching {dataTypes} order. Use only {outputFormat} format. No extra text. Data: {cleaned_text}"
        response = openai.Completion.create(
            engine="gpt-3.5-turbo",
            prompt=prompt,
            max_tokens=2000
        )
        print("GPT response: ", response.choices[0].text.strip())
        return {"gpt_response": response.choices[0].text.strip()}, 200
    except Exception as e:
        print(f"Error communicating with GPT: {str(e)}")
        return {"error": f"Error communicating with GPT: {str(e)}"}, 500

def send_review_results_to_client(source_url, keywords, dataTypes, outputFormat):
    """Send results to the frontend."""
    # Step 1: Get cleaned text
    cleaned_text_result, status_code = get_cleaned_text(source_url)
    if status_code != 200:
        return jsonify(cleaned_text_result)

    # Uncomment this step after using buying GPT API
    # Step 2: Send to GPT
    # gpt_result, status_code = send_to_gpt_api(cleaned_text_result["content"], keywords, dataTypes, outputFormat)
    # if status_code != 200:
    #     return jsonify(gpt_result)

    # Step 3: Respond back to the frontend
    return jsonify({
        'message': 'Task received successfully',
        'content': cleaned_text_result["content"],
        'keywords': keywords,
        'dataTypes': dataTypes,        
        # 'gpt_response': gpt_result["gpt_response"], //TODO: uncomment this line after buying GPT API  
        'outputFormat': outputFormat
    }), 200 

@app.route('/api/<string:user_id>/task', methods=['POST'])
def recieve_task(user_id):
    data = request.json
    source_url = data.get('sourceURL')
    keywords = data.get('keywords')
    outputFormat = data.get('outputFormat')
    dataTypes = data.get('dataTypes')
    print(f"Received task from user {user_id}: sourceURL={source_url}, keywords={keywords}, outputFormat={outputFormat}, dataTypes={dataTypes}")

    # Send review results to client
    return send_review_results_to_client(source_url, keywords, dataTypes, outputFormat)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)      