import os

from cs50 import SQL
from flask import Flask, flash, jsonify, redirect, render_template, request, session
from flask_session import Session
from flask_socketio import SocketIO, emit, join_room, leave_room, close_room, rooms, disconnect
from tempfile import mkdtemp

from helpers import generate_passage, pick_passage, BEST_PASSAGE

# Configure application

app = Flask(__name__)

app.config["TEMPLATES_AUTO_RELOAD"] = True
app.config['SECRET_KEY'] = 'secret!'

socketio = SocketIO(app)

# Dictionary in the form { room_id : frequency } where frequency is the number of players in the room
room_list = {}

# Ensure responses aren't cached
@app.after_request
def after_request(response):
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Expires"] = 0
    response.headers["Pragma"] = "no-cache"
    return response


# Configure session to use filesystem (instead of signed cookies)

# app.config["SESSION_FILE_DIR"] = mkdtemp()
# app.config["SESSION_PERMANENT"] = False
# app.config["SESSION_TYPE"] = "filesystem"
# Session(app)


# db = SQL(os.environ.get("DATABASE_URL")) # replace "DATABASE_URL" with the actual PostgreSQL URL


@app.route("/")
def index():
    session.pop("passage", None)
    session.pop("commands", None)

    return render_template("index.html")


@app.route("/1v1", methods=["GET", "POST"])
def ml():
    session.pop("commands", None)

    if request.method == "GET":
        return render_template("1v1.html", passage=pick_passage())


@app.route("/practice")
def practice():
    try:
        passage = session["passage"]
    except:
        passage = pick_passage()

    try:
        commands = session["commands"]
    except:
        commands = ""

    if "p best" in commands:
        passage = BEST_PASSAGE

    return render_template("practice.html", passage=passage, commands=commands)


@app.route("/again")
def again():
    session.pop("commands", None)

    return render_template("practice.html", passage=pick_passage())


@app.route("/commands", methods=["GET", "POST"])
def race():
    session.pop("commands", None)

    if request.method == "GET":
        return render_template("commands.html")

    session["commands"] = request.form.get("commands")

    return redirect("/practice")


@app.route("/generate", methods=["GET", "POST"])
def generate():

    if request.method == "GET":
        return render_template("generate.html")

    condition = request.form.get("first_word")
    passage = generate_passage(condition)

    session["passage"] = passage

    return redirect("/practice")


@socketio.on('join', namespace='/test')
def join(message):
    print('Joined room ' + message['room'])
    join_room(message['room'])

    # Gets room frequency, returns 0 if not found
    freq = room_list.get(message['room'], 0)

    emit('join_lobby', {
        'players' : freq
    }, room=message['room'])

    session['receive_count'] = session.get('receive_count', 0) + 1
    # emit('my_response',
    #      {'data': 'In rooms: ' + ', '.join(rooms()),
    #       'count': session['receive_count']})


@socketio.on('leave', namespace='/test')
def leave(message):
    leave_room(message['room'])
    session['receive_count'] = session.get('receive_count', 0) + 1
    # emit('my_response',
    #      {'data': 'In rooms: ' + ', '.join(rooms()),
    #       'count': session['receive_count']})


# @socketio.on('player1', namespace='/test')
# def player1():
#


@socketio.on('send_message', namespace='/test')
def send(message):
    emit('room_message', {
        'data' : message['data']
    }, room=message['room'])


if __name__ == '__main__':
    socketio.run(app, debug=True)
