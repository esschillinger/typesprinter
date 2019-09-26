import firebase_admin
from firebase_admin import credentials, firestore
from numpy.random import choice

TAGSETS_COLLECTION = 'tagsets'
WORDS_COLLECTION = 'words'

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

def generate_random_tag(db, initial_word):
    initial_word = initial_word.lower()

    initial_doc = load_word(db, initial_word)[0] # Force unpack - not advised, but should be resolved post-database-clean
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
