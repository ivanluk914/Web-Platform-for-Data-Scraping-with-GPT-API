import requests
from bs4 import BeautifulSoup

def get_cleaned_text(url):
    """Fetch and clean HTML content from the given URL."""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.111 Safari/537.36'
        }
        response = requests.get(url, headers=headers)
        
        if response.status_code != 200:
            print(f"Failed to retrieve the page. Status code: {response.status_code}")
            return
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        image_urls = [
            img['src'] for img in soup.find_all('img') 
        ]

        for tag in soup(["script", "style", "header", "footer", "nav", "aside"]):
            tag.decompose()
        
        text = soup.get_text(separator="\n")
        
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        cleaned_text = "\n".join(lines)
        
        print("Cleaned Text:")
        print(cleaned_text)
        return cleaned_text, image_urls
    except requests.exceptions.RequestException as e:
        print(f"Error accessing the URL: {e}")

url = "https://www.aldi.us/products/dairy-eggs/milk-milk-substitutes/"
cleaned_text, image_urls = get_cleaned_text(url)
print(len(cleaned_text))
print(image_urls)