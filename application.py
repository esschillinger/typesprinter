import os
import time

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
# form { room_id : passage }
room_passage = {}
# form { room_id : number of completed passages }
room_finish = {}


COUNTDOWN = 10


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
    # try:
    #     passage = session["passage"]
    # except:
    #     passage = pick_passage()

    try:
        commands = session["commands"]
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
    session.pop("commands", None)

    return render_template("practice.html", passage=pick_passage())


@app.route("/again")
def again():
    session.pop("commands", None)

    return render_template("practice.html", passage=pick_passage())


@app.route("/commands", methods=["GET", "POST"])
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





        # TODO: emit a 'player 1' event






        room_list[message['room']] = 1
        try:
            room_passage[message['room']] = session["passage"]
        except:
            room_passage[message['room']] = pick_passage()

    else:





        # TODO: emit a 'player n' event






        room_list[message['room']] += 1

    # debugging
    print('Look for this line...')
    print(rooms())
    print('room_list: ' + str(room_list))
    print(room_list[message['room']])

    emit('join_lobby', {
        'players' : room_list[message['room']],
        'passage' : room_passage[message['room']],
        'room' : message['room']
    }, room=message['room'])

    if not freq == 0:
        time.sleep(1) # sleep 1s to allow for event to be processed client-side so user2+ joins
        emit('update_countdown', {
            'timer' : COUNTDOWN,
            'room' : message['room']
        }, room=message['room'])

    session['receive_count'] = session.get('receive_count', 0) + 1
    # emit('my_response',
    #      {'data': 'In rooms: ' + ', '.join(rooms()),
    #       'count': session['receive_count']})


# @socketio.on('update_countdown', namespace='/test')
# def countdown(message):
#     room_timers[message['room']] = message['timer']


@socketio.on('leave', namespace='/test')
def leave(message):
    leave_room(message['room'])
    session['receive_count'] = session.get('receive_count', 0) + 1
    # emit('my_response',
    #      {'data': 'In rooms: ' + ', '.join(rooms()),
    #       'count': session['receive_count']})


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

# @socketio.on('player1', namespace='/test')
# def player1():
#


"""
def start_countdown(room):
    while room_timers[room] > 0:
        print(room_timers[room])
        emit('update_countdown', {
            'timer' : room_timers[room],
            'room' : room
        }, room=room)

        time.sleep(1)
        room_timers[room] -= 1
"""


if __name__ == '__main__':
    socketio.run(app, debug=True)
