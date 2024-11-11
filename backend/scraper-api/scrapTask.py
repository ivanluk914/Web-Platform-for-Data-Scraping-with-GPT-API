from flask import Flask, request, jsonify
import requests
from bs4 import BeautifulSoup
import os
from dotenv import load_dotenv
from flask_cors import CORS
import openai
from auth0.authentication import GetToken
import logging
import schedule
import time
from threading import Thread
from threading import Event


load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '../../.env'))

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')


scheduler_thread = None
stop_event = Event()

def initialize_scheduler():
    global scheduler_thread
    if scheduler_thread is None:
        scheduler_thread = Thread(target=run_schedule)
        logging.info("Starting scheduler thread")
        scheduler_thread.daemon = True  # This ensures the thread stops when the main program stops
        scheduler_thread.start()

def run_schedule():
    while not stop_event.is_set():
        #logging.info("Running schedule loop")
        schedule.run_pending()
        time.sleep(1)

def get_auth0_token():
    """Get Auth0 token for service-to-service communication"""
    domain = 'dev-dp4vp0xpt7cspfcl.us.auth0.com'
    client_id = os.getenv('AUTH0_CLIENT_ID')
    client_secret = os.getenv('AUTH0_CLIENT_SECRET')
    audience = f'https://{domain}/api/v2/'

    try:
        get_token = GetToken(domain, client_id, client_secret=client_secret)
        token = get_token.client_credentials(audience)
        if 'access_token' not in token:
            raise ValueError("No access token received from Auth0")
        return token['access_token']
    except Exception as e:
        print(f"Auth0 token error - domain: {domain}, error: {str(e)}")
        raise

openai.api_key = os.getenv('OPENAI_API_KEY')
token = get_auth0_token()

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
    img.get('src') for img in soup.find_all('img') if img.get('src') is not None
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
        results = gpt_response.split('},\\n    {')
    elif outputFormat == 'CSV':
        results = gpt_response.split('\\n')
    elif outputFormat == 'MARKDOWN':
        results = gpt_response.split('\\n')

    if outputFormat == 'MARKDOWN':
        preview_results = results[:5]
    elif outputFormat == 'JSON':
        preview_results = results[:3]
    elif outputFormat == 'CSV':
        preview_results = results[:4]

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


def get_gpt_summary(full_response):
    """Get the summary of the GPT response."""
    try:
        prompt = f"Summarize the following scraped data into one paragraph with less than 200 words:\n{full_response}"
        response = openai.ChatCompletion.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a summarization assistant."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=1500
        )

        summary = response.choices[0].message.content.strip()
        return {"summary": summary}, 200
    except Exception as e:
        print(f"Error communicating with GPT: {str(e)}")
        return {"error": f"Error communicating with GPT: {str(e)}"}, 500


def update_task(user_id, task_id, TaskDetails):
    """Update the task with TaskDetials."""
    try:
        url = f"http://admin-api:8080/api/user/{user_id}/task/{task_id}"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }

        response = requests.put(url, json=TaskDetails, headers=headers)
        if response.status_code != 200:
            print(f"Failed to update task. Status: {response.status_code}, Response: {response.text}")
            return {"error": f"Failed to update task. Status: {response.status_code}, Response: {response.text}"}, response.status_code
        return response.json(), response.status_code
    except Exception as e:
        print(f"Error updating task: {str(e)}")
        return {"error": f"Error updating task: {str(e)}"}, 500


@app.route('/api/<string:user_id>/task/<string:task_id>', methods=['PUT'])
def schedule_task(user_id, task_id):
    """Schedule a task based on the task's period."""
    data = request.json
    TaskDetails = data.get('TaskDetails', {})
    task_definition = TaskDetails.get('task_definition', {})
    print(f"task_definition: {task_definition}")
    task_name = TaskDetails.get('task_name', '')
    output = task_definition.get('output', [])
    source_url = task_definition.get('source', [])[0].get('url', '')
    keywords = [target.get('name', '') for target in task_definition.get('target', [])]
    dataTypes = [target.get('value', '') for target in task_definition.get('target', [])]
    outputFormat = output[0].get('type', 0)
    schedule_type = task_definition.get('period', 0)
    print(f"schedule_type: {schedule_type}")
    print(f"outputFormat: {outputFormat}")

    # Add output format mapping
    outputFormatMap = {
        1: 'JSON',
        2: 'CSV',
        4: 'MARKDOWN'
    }

    # Convert numeric output format to string
    outputFormatStr = outputFormatMap.get(outputFormat)
    if not outputFormatStr:
        return jsonify({"error": f"Invalid output format: {outputFormat}"}), 400

    def get_task_status(user_id, task_id):
        """Get current task status from admin API."""
        try:
            url = f"http://admin-api:8080/api/user/{user_id}/task/{task_id}"
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            }
            response = requests.get(url, headers=headers)
            if response.status_code == 200:
                return response.json()
            logging.error(f"Failed to get task status. Status: {response.status_code}, Response: {response.text}")
            return None
        except Exception as e:
            logging.error(f"Error getting task status: {str(e)}")
            return None

    def job():
        with app.app_context():
            logging.info(f"Executing scheduled job for task {task_id}")
            try:
                # Check if task is cancelled
                current_task = get_task_status(user_id, task_id)
                if current_task and current_task.get('status') == 5:  # 5 is TaskStatus.canceled
                    logging.info(f"Task {task_id} is cancelled, clearing schedule")
                    schedule.clear(f"task_{task_id}")
                    return

                logging.info(f"Fetching data from URL: {source_url}")
                response = send_review_results_to_client(task_name, source_url, keywords, dataTypes, outputFormatStr)

                if isinstance(response, tuple):
                    result = response[0].get_json()
                    status_code = response[1]
                else:
                    result = response.get_json()
                    status_code = 200

                logging.info(f"Response received with status code: {status_code}")

                if status_code != 200:
                    logging.error(f"Error response: {result}")
                    TaskDetails['status'] = 4
                    update_task(user_id, task_id, TaskDetails)
                    schedule.clear(f"task_{task_id}")
                    return

                if 'error' in result:
                    logging.error(f"GPT error: {result['error']}")
                    TaskDetails['status'] = 4
                    update_task(user_id, task_id, TaskDetails)
                    schedule.clear(f"task_{task_id}")
                    return

                logging.info("Updating task definition output")
                # Initialize output array if it doesn't exist
                if 'output' not in TaskDetails['task_definition']:
                    TaskDetails['task_definition']['output'] = []

                # Ensure we have at least 2 elements in the output array
                while len(TaskDetails['task_definition']['output']) < 2:
                    TaskDetails['task_definition']['output'].append({})

                # Update the preview + full response
                TaskDetails['task_definition']['output'][0]["value"] = result['gpt_response']
                TaskDetails['task_definition']['output'][1]["value"] = result['gpt_full_response']

                logging.info("Updating task with new response")
                update_response = update_task(user_id, task_id, TaskDetails)
                logging.info(f"Task update response: {update_response}")

                # Get the summary
                logging.info("Generating summary")
                gpt_summary, status_code = get_gpt_summary(result['gpt_full_response'])
                if status_code != 200:
                    logging.error(f"Error getting summary: {gpt_summary}")
                    return

                # Ensure we have space for the summary
                while len(TaskDetails['task_definition']['output']) < 3:
                    TaskDetails['task_definition']['output'].append({})

                # Update the summary
                TaskDetails['task_definition']['output'][2] = {
                    "type": 3,
                    "name": "summary",
                    "value": gpt_summary["summary"]
                }

                logging.info("Updating task with summary")
                final_update = update_task(user_id, task_id, TaskDetails)
                logging.info(f"Final update response: {final_update}")

            except Exception as e:
                logging.error(f"Error in scheduled job: {str(e)}")
                if 'result' in locals():
                    logging.error(f"Response data: {result}")
                TaskDetails['status'] = 4
                update_task(user_id, task_id, TaskDetails)
                schedule.clear(f"task_{task_id}")

    if schedule_type == 2:
        print("Scheduling minutely")
        schedule.every().minute.do(job).tag(f"task_{task_id}")
    elif schedule_type == 3:
        print("Scheduling hourly")
        schedule.every().hour.do(job).tag(f"task_{task_id}")
    elif schedule_type == 4:
        print("Scheduling daily")
        schedule.every().day.do(job).tag(f"task_{task_id}")
    elif schedule_type == 5:
        print("Scheduling weekly")
        schedule.every().week.do(job).tag(f"task_{task_id}")
    elif schedule_type == 6:
        print("Scheduling monthly")
        schedule.every().month.do(job).tag(f"task_{task_id}")
    else:
        return jsonify({"error": f"Invalid schedule type: {schedule_type}"}), 400

    # Initialize the scheduler if it's not already running
    initialize_scheduler()

    # Run the job immediately for the first time
    job()

    return jsonify({"message": "Task scheduled successfully"}), 200


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


@app.route('/api/<string:user_id>/task/<string:task_id>/summary', methods=['PUT'])
def update_task_summary(user_id, task_id):
    data = request.json
    TaskDetails = data.get('TaskDetails', {})
    task_definition = TaskDetails.get('task_definition', {})
    output = task_definition.get('output', [])
    full_response = output[1].get('value')
    if not full_response:
        return jsonify({"error": "Full response not found"}), 400
    gpt_summary, status_code = get_gpt_summary(full_response)
    if status_code != 200:
        print(f"Error getting GPT summary: {gpt_summary}")
        return jsonify(gpt_summary), status_code
    task_definition['output'].append({
            "type": 3,
            "name": "summary",
            "value": gpt_summary["summary"]
    })
    response, status_code = update_task(user_id, task_id, TaskDetails)
    return jsonify(response), status_code

@app.route('/api/<string:user_id>/task/<string:task_id>/cancel', methods=['PUT'])
def cancel_task(user_id, task_id):
    """Cancel a scheduled task."""
    try:
        # Get current task details
        current_task = get_task_status(user_id, task_id)
        if current_task:
            # Update task status to cancelled (5)
            current_task['status'] = 5
            update_task(user_id, task_id, current_task)

            # Clear the schedule
            schedule.clear(f"task_{task_id}")
            logging.info(f"Task {task_id} cancelled and schedule cleared")
            return jsonify({"message": "Task cancelled successfully"}), 200
        else:
            return jsonify({"error": "Task not found"}), 404
    except Exception as e:
        logging.error(f"Error cancelling task: {str(e)}")
        return jsonify({"error": f"Error cancelling task: {str(e)}"}), 500

# When the application starts
initialize_scheduler()

def cleanup():
    stop_event.set()
    if scheduler_thread:
        scheduler_thread.join()
    schedule.clear()
    logging.info("Scheduler thread joined and jobs cleared")

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)