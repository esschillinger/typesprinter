import os

from cs50 import SQL
from flask import Flask, flash, jsonify, redirect, render_template, request, session
from flask_session import Session
from tempfile import mkdtemp

from helpers import generate_passage

# Configure application

app = Flask(__name__)

app.config["TEMPLATES_AUTO_RELOAD"] = True

# Ensure responses aren't cached
@app.after_request
def after_request(response):
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Expires"] = 0
    response.headers["Pragma"] = "no-cache"
    return response


# Configure session to use filesystem (instead of signed cookies)
app.config["SESSION_FILE_DIR"] = mkdtemp()
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)


# db = SQL(os.environ.get("DATABASE_URL")) # replace "DATABASE_URL" with the actual PostgreSQL URL - used to store RNN weights


@app.route("/", methods=["GET", "POST"])
def index():
    if request.method == "GET":
        return render_template("index.html")
    
    condition = request.form.get("first_word")
    passage = generate_passage(condition)
    
    session["passage"] = passage
    
    return redirect("/practice")


@app.route("/practice")
def generate():
    passage = session["passage"]
    
    '''
    first = passage[0]
    
    stop = passage.find(" ")
    if stop == -1:
        second = ""
    else:
        second = passage[1:stop]
    
    third = passage[stop:]
    '''
    
    return render_template("practice.html", passage=passage)


@app.route("/1v1")
def race():
    return render_template("1v1.html")
