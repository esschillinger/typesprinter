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
import string
import nltk
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
    'Sometimes terrible things happen, but there\'s nothing more terrible than not having anybody to tell it to.',
    'There is nothing sweeter in this sad world than the sound of someone you love calling your name.',
    'But I really believe that there are more good people on this earth than bad people, and the good people watch out for each other and take care of each other.',
    'Few smart kids can spare the attention that popularity requires. Unless they also happen to be good-looking, natural athletes, or siblings of popular kids, they\'ll tend to become nerds. And that\'s why smart people\'s lives are worst between, say, the ages of eleven and seventeen. Life at that age revolves far more around popularity than before or after.',
    'Imagine for a moment that among humans some people can fly. Government staff come and tell you that you can take a course that will teach you how. This sounds great, and one hears of emotional accounts of what it is like to soar in the sky. But you have no personal experience of what flying feels like. To learn it you must go for six to nine months daily to school. You do exercises like flapping your arms but you never really take off. And you do not often need to fly anywhere. Whenever you do, you can either take the plane or send a relative who can fly to do what is needed. So, is the benefit worth the effort?'
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

'''
def apology(message, code=400):
    """Render message as an apology to user."""
    def escape(s):
        """
        Escape special characters.
        https://github.com/jacebrowning/memegen#special-characters
        """
        for old, new in [("-", "--"), (" ", "-"), ("_", "__"), ("?", "~q"),
                         ("%", "~p"), ("#", "~h"), ("/", "~s"), ("\"", "''")]:
            s = s.replace(old, new)
        return s
    return render_template("apology.html", top=code, bottom=escape(message)), code
'''

def pick_passage():
    random.seed()
    return PRESET_PASSAGES[random.randint(0, len(PRESET_PASSAGES) - 1)]

def apology(message, code=400):
    """Render message as an apology to user."""
    def escape(s):
        """
        Escape special characters.
        https://github.com/jacebrowning/memegen#special-characters
        """
        for old, new in [("-", "--"), (" ", "-"), ("_", "__"), ("?", "~q"),
                         ("%", "~p"), ("#", "~h"), ("/", "~s"), ("\"", "''")]:
            s = s.replace(old, new)
        return s
    return render_template("apology.html", top=code, bottom=escape(message)), code

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

def num_sentences(s):
    tagged = nltk.pos_tag(nltk.word_tokenize(s))
    tags = [tag[1] for tag in tagged]

    return (tags.count("."), tagged, tags)

def shorten_passage(s, num, tagged, tags):
    index = -1
    for _ in range(num):
        index = tags.index(".", index + 1)

    end_string = tagged[index - 1][0] + tagged[index][0] # Bogde. Not guaranteed to work, but pretty damn sure it will

    return s[:s.index(end_string)] + end_string

def remove_non_ascii(s):
    printable = set(string.printable)

    return ''.join(filter(lambda x: x in printable, s))

def find_passage(query, exact):
    headers = { "User-Agent" : "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36" }

    try:
        r = requests.get("https://www.google.com/search?q=" + query, headers=headers)
        soup = BeautifulSoup(r.text, "html.parser")
    except:
        return "First"

    elements = soup.select("a")
    elems = []
    for elem in elements:
        try:
            href = elem['href']
            if href[:7] == "http://" or href[:8] == "https://":
                elems.append(href)
        except:
            pass

    if len(elems) == 0:
        return "<NO-URLS>"

    ps = []
    while(len(elems)) > 0:
        url = random.choice(elems)
        elems.remove(url)

        r2 = requests.get(url, headers=headers)
        soup2 = BeautifulSoup(r2.text, "html.parser")

        ps = [p.text.strip() for p in soup2.find_all("p") if query.lower() in p.text.lower() or not bool(exact)]
        if len(ps) > 0:
            break

    if len(ps) == 0:
        return "<NO-PASSAGES>"

    chosen = random.choice(ps)

    (n, tagged, tags) = num_sentences(chosen)

    MAX_SENTENCES = 4
    if n > MAX_SENTENCES:
        chosen = shorten_passage(chosen, MAX_SENTENCES, tagged, tags)

    return remove_non_ascii(chosen)
