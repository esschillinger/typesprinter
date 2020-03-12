let solid_cursor = true;
let hollow_cursor = false;
let current_x = 65;
let current_y = 40;
let canvas_width = 0;
let character_width = 20;
let space_width = 5;
let cursor_width = 20;
let cursor_height = 40;
let cursor_x = current_x;
let cursor_y = current_y;
let font = "40px Ubuntu Mono";
let chars_locations = [];
let lines = []; // Keeps track of the last index of a command when a user hits enter
let user_commands = [];
let acceptable_chars = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h',
                       'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p',
                       'q', 'r', 's', 't', 'u', 'v', 'w', 'x',
                       'y', 'z', '0', '1', '2', '3', '4', '5',
                       '6', '7', '8', '9', '(', ')', '[', ']',
                       '{', '}', ' ', '+', ';', ':', ',', '.',
                       '/', '<', '>', '?', '!', '@', '#', '$',
                       '%', '^', '&', '*', '-', '=', '_', '"',
                       '\'', '\\'];

function loadKeyboardListener() {
    loadCanvas();
    updateCursor();

    document.addEventListener('keydown', (e) => {
            if (acceptable_chars.includes(e.key.toLowerCase())) {
                addText(e.key, "white");
            } else if (e.key === "Backspace") {
                if (chars_locations.length > 0) {
                    if (lines.length > 0) {
                        if ((chars_locations.length > lines[lines.length - 1] + 1) || user_commands[user_commands.length - 1] == "clear") { // Deals with user trying to backspace after "clear"?
                                addText(e.key, "black");
                        }
                    } else {
                        addText(e.key, "black");
                    }
                }
            } else if (e.key === "Enter") {
                lines.push(chars_locations.length - 1);

                logCommand();
            }
    });
}

function loadCanvas() {
    var term = document.getElementById("canvas-terminal-body");
    canvas_width = term.width;

    var canvas_top = document.getElementById("canvas-terminal");
    var context = canvas_top.getContext("2d");

    drawCircle(20, 20, 10, "#ff6159", context);
    drawCircle(50, 20, 10, "#febf2d", context);
    drawCircle(80, 20, 10, "#29cd42", context);

    context.font = "24px Ubuntu Mono";
    context.fillStyle = "white";
    context.fillText(">_ Terminal", 425, 27.5);

    var canvas_main = document.getElementById("canvas-terminal-body");
    context = canvas_main.getContext("2d");

    context.font = font;
    context.fillStyle = "white";
    context.fillText("$", 25, current_y);

    document.addEventListener('click', function() {
        if (document.activeElement.tagName != "BODY") {
            hollow_cursor = true;
            drawHollowCursor(current_x, current_y); // Update the cursor immediately instead of waiting  <= 750 milliseconds for setInterval() to update
        } else {
            hollow_cursor = false;
        }
    });
}

//makes a circle of radius r with center {x, y} parameterized in the counterclockwise direction
function drawCircle(x, y, r, color, context) {
    context.beginPath();
    context.arc(x, y, r, 0, 2 * Math.PI, true);
    context.fillStyle = color;
    context.fill();
}

function addText(character, color) {
    var canvas_main = document.getElementById("canvas-terminal-body");
    var context = canvas_main.getContext("2d");

    context.fillStyle = "#1e2325";
    context.fillRect(current_x, current_y - 33, cursor_width, cursor_height);

    context.font = font;
    context.fillStyle = color;

    if (color == "white") {
        context.fillText(character, current_x, current_y);
        chars_locations.push([character, current_x, current_y]);

        current_x += character_width + space_width;
        if (current_x + space_width + cursor_width >= canvas_width) {
            current_x = 65;
            current_y += 45;
        }

        context.fillRect(current_x, current_y - 33, cursor_width, cursor_height); //Keep moving the cursor to right in front of the last character
    } else {
        let i = chars_locations.length - 1;
        if (i != -1) {
            let removed_character = chars_locations.pop();
            current_x = removed_character[1];
            current_y = removed_character[2];

            context.fillStyle = "white";
            context.fillRect(current_x, current_y - 33, cursor_width, cursor_height); //Keep moving the cursor back
        }
    }
}

function drawCursor(x, y) {
    var canvas_main = document.getElementById("canvas-terminal-body");
    var context = canvas_main.getContext("2d");

    context.fillStyle = "white";
    if (!solid_cursor) {
        context.fillStyle = "#1e2325";
    }

    context.fillRect(x, y - 33, cursor_width, cursor_height);
    let index = checkCoordinates(x, y);
    if (index != -1) {
        if (solid_cursor) {
            context.fillStyle = "#1e2325";
        } else {
            context.fillStyle = "white";
        }

        context.fillText(chars_locations[index][0], x, y)
    }

    if (solid_cursor) {
        solid_cursor = false;
    } else {
        solid_cursor = true;
    }
}

function drawHollowCursor(x, y) {
    var canvas_main = document.getElementById("canvas-terminal-body");
    var context = canvas_main.getContext("2d");

    context.fillStyle = "white";
    context.fillRect(x, y - 33, cursor_width, cursor_height);
    context.fillStyle = "#1e2325";
    context.fillRect(x + (cursor_width * 0.1), y - 33 + (cursor_width * 0.1), cursor_width * 0.8, cursor_height - 2 * (cursor_width * 0.1));        // THIS IS FOR WHEN THE TERMINAL ISN'T FOCUSED
}

function checkCoordinates(x, y) {
    for (var i = 0; i < chars_locations.length; i++) {
        if (chars_locations[i][1] == x && chars_locations[i][2] == y) {
            return i;
        }
    }
    return -1;
}

function logCommand() {
    let log = "";
    var i = 0;
    if (lines.length > 1) {
        i = lines[lines.length - 2] + 1;
    }

    if (i > lines[lines.length - 1]) { // Deals with user entering "clear" command?
        i = 0;
    }

    for (i; i <= lines[lines.length - 1]; i++) {
        log += chars_locations[i][0];
    }
    user_commands.push(log);

    executeCommand(log);
}

function executeCommand(command) {
    var canvas_main = document.getElementById("canvas-terminal-body");
    var context = canvas_main.getContext("2d");

    context.fillStyle = "#1e2325";
    context.fillRect(current_x, current_y - 33, cursor_width, cursor_height);









    // Another TODO: Change index.html so that the focused panel (being hovered over) expands smoothly in size (ANIMATION), make actual icons (generate should be an atom that animates on panel hover--the atom should be traced out with the animation on loop, as if you had a parameterization for the atom as a curve and you were dragging a slider that shows the particle's path over all values of t)









    switch (command) { // Consider using two input fields: one for commands that apply to me, the other for commands that apply to my opponent
        case "clear":
            context.fillStyle = "#1e2325";
            context.fillRect(0, 0, canvas_main.width, canvas_main.height);

            chars_locations = [];
            current_y = 40;

            break;

        case "grad": // This should be a harmless cheat for me
            let body = document.querySelector("body");
            body.className = "gradient header";
            body.style.position = "relative"; // For whatever reason, this one style messes up the gradient, so manually change the position from absolute to relative
            current_y += 45;

            break;

        case "wpm -rb": // This should be a disadvantageous cheat for them
            document.querySelector("input").value += command;
            current_y += 45;

            break;

        case "wpm -sz": // This should be a disadvantageous cheat for them
            document.querySelector("input").value += command;
            current_y += 45;

            break;

        case "autowin": // This should be an advantageous cheat for me
            document.querySelector("input").value += command;
            current_y += 45;

            break;

        case "p best": // This one could go either way--Mrs. Denna beat me on it by going 125 wpm
            document.querySelector("input").value += command;
            current_y += 45;

            break;

        case "incorrect": // Makes every nth character typed by them wrong no matter what, ideally pretty inconspicuous
            document.querySelector("input").value += command;
            current_y += 45;

            break;

        case "pos xy -r":
            document.querySelector("input").value += command;
            current_y += 45;

            break;

        case "autocorrect":
            document.querySelector("input").value += command;
            current_y += 45;

            break;

        case "run": // Executes the commands
            document.querySelector("form").submit();

            break;

        default:
            current_y += 45;
    }

    context.font = font;
    context.fillStyle = "white";
    context.fillText("$", 25, current_y);

    current_x = 65;

    solid_cursor = true;
    drawCursor(current_x, current_y);
}

function updateCursor() {
    setInterval(function() {
        if (!hollow_cursor) {
            drawCursor(current_x, current_y);
        } else {
            drawHollowCursor(current_x, current_y);
        }
    }, 750);
}
