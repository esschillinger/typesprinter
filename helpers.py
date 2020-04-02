from flask import redirect, render_template, request, session
from firebase_admin import credentials, firestore
from urllib.request import urlopen
from numpy.random import choice
from bs4 import BeautifulSoup
from functools import wraps
import http.cookiejar
import firebase_admin
# import mechanize
import requests
import random
# import json
import sys
# import os
# import re

TAGSETS_COLLECTION = 'tagsets'
WORDS_COLLECTION = 'words'
PRESET_PASSAGES = [
    'The time I waited seemed endless, and I felt doubts and fears crowding upon me. What sort of place had I come to, and among what kind of people? What sort of grim adventure was it on which I had embarked?',
    'Most of what I learnt at Cambridge had to be painfully unlearnt later; on the whole, what I had learnt for myself from being left alone in an old library had proved more solid.',
    'But I can\'t imagine a life without breathless moments breaking me down.',
    'Waits at the window, wearing the face that she keeps in a jar by the door. Who is it for?',
    'A few minutes ago, I almost made the biggest mistake of my professional life and it was because I was doing something that just wasn\'t me.',
    'It was hard to toss things I had once thought were valuable enough to spend money on and just as hard to separate myself from worn and ragged clothing I had for sentimental reasons. Once I\'d passed through the first few tough decisions, though, the momentum had been built and it was a breeze.',
    'Say what you will. But a person just cannot know what he doesn\'t know. And you can\'t always see that a bad thing is going to happen before it happens. If you could, no bad would ever come.',
    'I only know that learning to believe in the power of my own words has been the most freeing experience of my life. It has brought me the most light. And isn\'t that what a poem is? A lantern glowing in the dark.',
    'It feels scary to talk, because once the words are out, you can\'t put them back in. But if you write words and they don\'t come out the way you want them to, you can erase them and start over.',
    'Maybe, the only thing that has to make sense about being somebody\'s friend is that you help them be their best self on any given day. That you give them a home when they don\'t want to be in their own.',
    'Soon, the sky darkened, the streetlights brightened, and it was finally time for dinner.',
    'When you realize you want to spend the rest of your life with somebody, you want the rest of your life to start as soon as possible.',
    'I didn\'t know it would be people you barely knew becoming friends that harbored you. And dreams you didn\'t even know you had - coming true. I didn\'t know it would be superpowers rising up out of tragedies, and perfect moments in a nearly empty classroom.',
    'There is freedom in coming and going for no other reason than because you can. There is freedom in choosing to sit and be still when everything is always telling you to move, move fast.',
    'No one would ever say, "Come and join us, Caroline," so I would then spend the rest of the lunch period feeling sorry for myself and trying to remember that the lonely children like me are the ones who grow up to be someone that everyone wishes they could be.',
    'Your silence furnishes a dark house. But even at the risk of burning, the moth always seeks the light.',
    'I could tell he was trying to shake off his feelings. He didn\'t like to be angry. I loved that about him, that he really wanted to be happy.',
    'Everyone is to blame. He says that when you separate people into groups, they start to believe that one group is better than another. I think about Papa\'s medical books and how we all have the same blood, and organs, and bones inside us, no matter what religion we\'re supposed to be.',
    'We know that there is not one person who, after hearing these words, would deny their truth and say that he wanted something else, but he would believe that he had heard exactly what he had desired for a long time - namely, to be melted in unison with his beloved, and the two of them become one. The reason is that our ancient nature was thus and we were whole. And so love is merely the name for the desire and pursuit of the whole.',
    'I never thought I\'d feel this way, and as far as I\'m concerned I\'m glad I got the chance to say that I do believe I love you.',
    'Sometimes terrible things happen, but there\'s nothing more terrible than not having anybody to tell it to.'
]
BEST_PASSAGE = 'When you realize you want to spend the rest of your life with somebody, you want the rest of your life to start as soon as possible.'

def login_required(f):
    """
    Decorate routes to require login.
    http://flask.pocoo.org/docs/1.0/patterns/viewdecorators/
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if session.get("user_id") is None:
            return redirect("/verify")
        return f(*args, **kwargs)
    return decorated_function

def initialize_database():
    cred = credentials.Certificate('./ServiceAccountKey.json')
    default_app = firebase_admin.initialize_app(cred)
    db = firestore.client()

    return db

def load_word(db, word):
    docs = db.collection(WORDS_COLLECTION).where(u'word', u'==', word).get()

    return [doc.to_dict() for doc in docs]

def load_tagset(db, tag):
    docs = db.collection(TAGSETS_COLLECTION).where(u'TAGNAME', u'==', tag).get()

    return [doc.to_dict() for doc in docs]

def generate_random_tag(db, starter):
    initial_word = starter.split(' ')[-1].lower()

    initial_doc = load_word(db, initial_word)[0] # Force unpack--not advised, but should be resolved post-database-clean
    keys = list(initial_doc.keys())
    keys.remove('word')
    vals = []
    for key in keys:
            vals.append(initial_doc[key])
    sum = 0
    for val in vals:
        sum += val
    prob_distribution = [val/sum for val in vals]
    next_tag = choice(keys, 1, p = prob_distribution)

    return next_tag[0]

def generate_random_word(db, initial_tag):
    initial_doc = load_tagset(db, initial_tag)[0] # Force unpack - OK because the tag is guaranteed to exist
    keys = list(initial_doc.keys())
    keys.remove('TAGNAME')
    vals = []
    for key in keys:
        vals.append(initial_doc[key])
    sum = 0
    for val in vals:
        sum += val
    prob_distribution = [val/sum for val in vals]
    next_word = choice(keys, 1, p = prob_distribution)

    return next_word[0]

def re_substitute(str):
    str = str.replace('PERIOD', '.')
    str = str.replace('SLASH', '/')

    return str

database = initialize_database()

def generate_passage(initial_condition):
    sentence = initial_condition
    making_sentence = True
    while making_sentence:
        tag = generate_random_tag(database, initial_condition)
        if tag == 'PERIOD':
            punctuation = generate_random_word(database, tag)
            punctuation = re_substitute(punctuation)
            sentence += punctuation
            making_sentence = False
        else:
            word = generate_random_word(database, tag)
            word = re_substitute(word)

            if word == ',' or word == '\'s' or word == ':' or word == ';':
                sentence += word
            else:
                sentence += ' ' + word

            initial_condition = word

    return sentence

def pick_passage():
    random.seed()
    return PRESET_PASSAGES[random.randint(0, len(PRESET_PASSAGES) - 1)]

"""
def query_google(query):
    br = mechanize.Browser()
    cj = http.cookiejar.LWPCookieJar()
    br.set_cookiejar(cj)

    br.set_handle_equiv(True)
    br.set_handle_gzip(True)
    br.set_handle_redirect(True)
    br.set_handle_referer(True)
    br.set_handle_robots(False)

    br.set_handle_refresh(mechanize._http.HTTPRefreshProcessor(), max_time=1)

    br.addheaders = [('User-agent', 'Mozilla/5.0 (X11; U; Linux i686; en-US; rv:1.9.0.1) Gecko/2008071615 Fedora/3.0.1-1.fc9 Firefox/3.0.1')]

    url = "https://www.google.com/search?q=" + query.replace(" ", "+") + "&safe=off&client=ubuntu&hs=Hrw&channel=fs&biw=1317&bih=678&hl=en&um=1&ie=UTF-8&source=og&sa=N&tab=wi"
    print("\n\n\n" + url + "\n\n\n")

    r = br.open(url)
    html = r.read()
    soup = BeautifulSoup(html, "html.parser")

    return soup

def scrape_for_passage(query):
    response = query_google(query)
    urls = [url for url in response.find_all("a") if "http://" in url or "https://" in url]

    page = BeautifulSoup(urllib.request.urlopen(urls[random.randint(0, len(urls) - 1)].attrs['href']), "html.parser")
    paras = [p for p in soup.find_all('p') if query in p]

    return paras[random.randint(0, len(paras) - 1)]
"""

def remove_non_ascii(s):
    return ''.join(i for i in s if ord(i) < 128)

def scan_case_insensitive(query, text):
    return query.lower() in text or query.upper() in text or query.title() in text

def find_passage(query):
    headers = { "User-Agent" : "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36" }

    r = requests.get("https://www.google.com/search?q=" + query, headers=headers)
    soup = BeautifulSoup(r.text, "html.parser")

    elements = soup.select("a")
    elems = []
    for i in range(len(elements)):
        try:
            href = elements[i]['href']
            if href[:7] == "http://" or href[:8] == "https://":
                elems.append(href)
        except:
            pass

    ps = []
    while len(ps) == 0:
        url = elems[random.randint(0, len(elems) - 1)]
        r2 = requests.get(url, headers=headers)
        soup2 = BeautifulSoup(r2.text, "html.parser")
        ps = [p.text.strip() for p in soup2.find_all("p") if scan_case_insensitive(query, p.text)]

    upper = len(ps) - 1
    if upper == 0:
        return remove_non_ascii(ps[0])
    else:
        return remove_non_ascii(ps[random.randint(0, upper)])
