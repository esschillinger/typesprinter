import os
import time

from cs50 import SQL
from flask import Flask, flash, jsonify, redirect, render_template, request, session
from flask_session import Session
from flask_socketio import SocketIO, emit, join_room, leave_room, close_room, rooms, disconnect
from tempfile import mkdtemp
from werkzeug.security import check_password_hash, generate_password_hash

from helpers import generate_passage, pick_passage, BEST_PASSAGE, login_required

# Configure application

app = Flask(__name__)

app.config["TEMPLATES_AUTO_RELOAD"] = True
app.config['SECRET_KEY'] = 'secret!'

socketio = SocketIO(app)

# Dictionary in the form { room_id : frequency } where frequency is the number of players in the room
room_list = {}
# form { room_id : passage }
room_passage = {}
# form { room_id : number of completed passages }
room_finish = {}


COUNTDOWN = 5


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
    # session.pop("commands", None)

    return render_template("index.html")


@app.route("/1v1", methods=["GET", "POST"])
def ml():
    try:
        commands = session["commands"]
        print(commands)
    except:
        commands = ""

    if "p best" in commands:
        passage, session["passage"] = BEST_PASSAGE, BEST_PASSAGE
    else:
        passage = pick_passage()

    if request.method == "GET":
        return render_template("1v1.html", passage=passage, commands=commands)


@app.route("/practice")
def practice():
    # session.pop("commands", None)

    return render_template("practice.html", passage=pick_passage())


@app.route("/again")
def again():
    # session.pop("commands", None)

    return render_template("practice.html", passage=pick_passage())


@app.route("/verify", methods=["GET", "POST"])
def login():
    session.clear()

    if request.method == "GET":
        return render_template("verify.html")

    # You really thought I was gonna hard-code a non-hashed password?
    if(check_password_hash("pbkdf2:sha256:150000$Yd7q1JuY$06aeeb26761c11fa8ebf687f493207bd18cbf0be42fd567fbe35215c1ed42bd0", request.form.get("password"))):
        session["user_id"] = "admin"
        return redirect("/admin")

    return redirect("/")


@app.route("/admin", methods=["GET", "POST"])
@login_required
def race():
    session.pop("commands", None)
    session.pop("passage", None)

    if request.method == "GET":
        return render_template("commands.html")

    session["commands"] = request.form.get("commands")

    return redirect("/1v1")


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
    freq = room_list.get(message['room'], 0) # https://github.com/miguelgrinberg/Flask-SocketIO/issues/105

    if freq == 0:
        room_list[message['room']] = 1
        try:
            room_passage[message['room']] = session["passage"]
        except:
            room_passage[message['room']] = pick_passage()
    else:
        room_list[message['room']] += 1

    emit('join_lobby', {
        'players' : room_list[message['room']],
        'passage' : room_passage[message['room']],
        'room' : message['room']
    }, room=message['room'])

    if not freq == 0:
        emit('update_countdown', {
            'timer' : COUNTDOWN,
            'room' : message['room']
        }, room=message['room'])

    session['receive_count'] = session.get('receive_count', 0) + 1


@socketio.on('leave', namespace='/test')
def leave(message):
    leave_room(message['room'])
    session['receive_count'] = session.get('receive_count', 0) + 1


@socketio.on('race finished', namespace='/test')
def rank(message):
    finished = room_finish.get(message['room'], 0)

    if finished == 0:
        room_finish[message['room']] = 1
    else:
        room_finish[message['room']] += 1

    # taken from https://stackoverflow.com/questions/9647202/ordinal-numbers-replacement
    ordinal = lambda n: "%d%s" % (n,"tsnrhtdd"[(n/10%10!=1)*(n%10<4)*n%10::4])

    emit('end_message', {
        'place' : ordinal(room_finish[message['room']])
    })

    if room_finish[message['room']] == room_list[message['room']]:
        room_list.pop(message['room'], None)
        room_passage.pop(message['room'], None)
        room_finish.pop(message['room'], None)


if __name__ == '__main__':
    socketio.run(app, debug=True)
