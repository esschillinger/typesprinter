import firebase_admin
from firebase_admin import credentials, firestore
from numpy.random import choice
import random

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
    'It feels scary to talk, because once the words are out, you can\'t put them back in. But if you write words and they don\'t come out the way you want them to, you can erase them and start over.'
]

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
            
            if word == ',':
                sentence += word
            else:
                sentence += ' ' + word
                
            initial_condition = word
            
    return sentence

def pick_passage():
    random.seed()
    return PRESET_PASSAGES[random.randint(0, len(PRESET_PASSAGES) - 1)]
