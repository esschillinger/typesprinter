import datetime
import random
import re
import time
from bs4 import BeautifulSoup
from urllib.request import urlopen
from urllib.error import HTTPError

def clean_text(text, isWiki):
    new = ''
    bracket = False
    for char in text:
        ascii = ord(char)
        if ascii >= 32 and ascii <= 126:
            if isWiki:
                if ascii == 91:
                    bracket = True
                if not bracket:
                    new += char
                if ascii == 93: # Order matters here--place this after the character addition statement to ensure the right bracket is not included
                    bracket = False
            else:
                new += char

    return new

base_url = 'reddit.com'
soup = BeautifulSoup(urlopen('https://www.' + base_url), 'html.parser')

links = [a['href'] for a in soup.find_all('a', href=True) if len(a['href']) >= len(base_url) and not base_url in a['href']]
print(links)

texts = []
for i in range(0, len(links)):
    url = links[i]
    if not url[:6] == 'https:':
        url = 'https:' + url
    print(i, len(links), url)
    try:
        soup = BeautifulSoup(urlopen(url), 'html.parser')
        data = [clean_text(p.text.strip(), 'wikipedia.org' in url) for p in soup.find_all('p')] # Evaluate whether or not it is a wikipedia link in-line
        texts.append(' '.join(data))
    except HTTPError:
        pass

print(texts)
