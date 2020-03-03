# Welcome to TypeSprinter!

Test your typing speed by playing in any of the modes shown by the panels.

To run locally:

1. Clone the repository
2. Open a terminal or command prompt window
3. Enter the following:
```sh
$ cd "C:\path\to\typesprinter"
$ python application.py
 * Restarting with stat
 * Debugger is active!
 * Debugger PIN: <PIN>
 * (<int>) wsgi starting up on http://127.0.0.1:5000/
```
4. Open a browser and go to the output link `http://127.0.0.1:5000/`

Alternatively, you can visit the [TypeSprinter website](http://typesprinter.herokuapp.com/) to play--no extra work required! Currently hosting the 2/29/2020 version of the app (leap day!).

## Race Another User

Choose any `room_id` that you'd like and tell your friend(s) to join you in the same room! Supports 3+ players as well! If you'd like to reuse the same `room_id` again, be sure that everyone that has joined has finished the race, otherwise the passage won't reset.

## Practice

You can start typing whenever you'd like, which will start the timer. Just you, the passage, and the clock.

## Generate a Passage

Still in development, though currently semi-functional but mostly incoherent. Type a word, any word, and if it's currently known to the cloud "dictionary," it'll be used to generate a random sentence (and random it is, at the moment). You can then type this entirely unique sentence, never before read by another human being, as your practice passage.

Happy sprinting (or jogging)!
