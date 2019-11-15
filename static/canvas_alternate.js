let canvas_main = "";
let context = "";
let solid_cursor = true;
let current_x = 65; // Use current_x and current_y to keep track of cursor position instead of character position
let current_y = 40;
let canvas_width = 1000;
let canvas_height = 200;
let character_width = 20;
let space_width = 5;
let cursor_width = 20;
let cursor_height = 40;
let font = "40px Ubuntu Mono";
let chars_locations = [];
let acceptable_chars = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h',
                       'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p',
                       'q', 'r', 's', 't', 'u', 'v', 'w', 'x',
                       'y', 'z', '0', '1', '2', '3', '4', '5',
                       '6', '7', '8', '9', '(', ')', '[', ']',
                       '{', '}', ' ', '+', ';', ':', ',', '.',
                       '/', '<', '>', '?', '!', '@', '#', '$',
                       '%', '^', '&', '*', '-', '=', '_', '"',
                       '\'', '\\'];

function loadCanvas() {
    var canvas_top = document.getElementById("canvas-terminal");
    var ctx = canvas_top.getContext("2d");
    
    drawCircle(20, 20, 10, "#ff6159", ctx);
    drawCircle(50, 20, 10, "#febf2d", ctx);
    drawCircle(80, 20, 10, "#29cd42", ctx);
    
    ctx.font = "25px Ubuntu Mono";
    ctx.fillStyle = "black";
    ctx.fillText("tph/bash", 450, 27.5);
  
    canvas_main = document.getElementById("canvas-terminal-body");
    context = canvas_main.getContext("2d");
    
    context.font = font;
    context.fillStyle = "white";
    context.fillText("$", 25, 40);
    
    document.addEventListener('keydown', (e) => {
        if (acceptable_chars.includes(e.key.toLowerCase())) {
            addCharacter(e.key);
        } else if (e.key === "Backspace") {
            removeCharacter();
        } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
            moveCursor(e.key.substring(5));
        }
    });
}

// Makes a circle of radius r with center {x, y} parameterized in the counterclockwise direction
function drawCircle(x, y, r, color, context) {
    context.beginPath();
    context.arc(x, y, r, 0, 2 * Math.PI, true);
    context.fillStyle = color;
    context.fill();
}

function addCharacter(character) {
    let index = checkCoordinates(current_x, current_y);
    if (index == -1) {
        chars_locations.splice(index, 0, [character, current_x, current_y]);
        current_x += character_width + space_width;
    } else {
        for (var i = index; i < chars_locations.length; i++) {
            chars_locations[i][1] += character_width + space_width;
            if (chars_locations[i][1] > canvas_width - character_width - space_width) {
                chars_locations[i][1] = 65;
                chars_locations[i][2] += 40;
            }
        }
    }
  
    if (current_x >= canvas_width) {
        current_x = 65;
        current_y += 40;
    }
  
    writeCanvas();
}

function removeCharacter() {
    var index = -1;
    let max_chars = Math.floor((canvas_width - 65) / character_width);
    if (current_x == 65) {
        index = checkCoordinates(65 + max_chars * (character_width + space_width), current_y - 40);
    } else {
        index = checkCoordinates(current_x - space_width - character_width, current_y); // Must also account for if the previous character is the last character of the line above
    }
    
    if (index != -1) {
        let removed = chars_locations.splice(index, 1);
        current_x = removed[1];
        current_y = removed[2];
        
        for (var i = index; i < chars_locations.length; i++) {
            chars_locations[i][1] -= (character_width + space_width);
            if (chars_locations[i][1] < 65) {
                chars_locations[i][1] = 65 + max_chars * (character_width + space_width);
                chars_locations[i][2] -= 40;
            }
        }
        console.log("(" + current_x + ", " + current_y + ")");
    }
  
    writeCanvas();
}

function moveCursor(direction) {
    if (direction == "Left") {
        current_x -= (character_width + space_width);
        if (current_x < 65) {
            let max_chars = Math.floor((canvas_width - 65) / character_width);
            current_x = 65 + max_chars * (character_width + space_width);
            current_y -= 40;
        }
    } else {
         current_x += character_width + space_width;
         if (current_x > canvas_width) {
             current_x = 65;
             current_y += 40;
         }
    }
    
    drawCursor();
}

function writeCanvas() {
    context.fillStyle = "black";
    context.fillRect(0, 0, canvas_width, canvas_height);
  
    context.font = font;
    context.fillStyle = "white";
    context.fillText("$", 25, 40);
    
    for (var i = 0; i < chars_locations.length; i++) {
        let set = chars_locations[i];
        context.fillText(set[0], set[1], set[2]);
    }
  
    drawCursor();
}

function drawCursor() {
    if (solid_cursor) {
        context.fillStyle = "white";
        context.fillRect(current_x, current_y - 33, cursor_width, cursor_height);
    } else {
        context.fillStyle = "black";
        context.fillRect(current_x, current_y - 33, cursor_width, cursor_height);
    }
    
    if (chars_locations.length != 0) {
        let last_char = chars_locations[chars_locations.length - 1];
        if (!((current_x > last_char[1] && current_y == last_char[2]) || (current_x < last_char[1] && current_y > last_char[2]))) {
            if (solid_cursor) {
                context.fillStyle = "white";
            } else {
                context.fillStyle = "black";
            }
                context.font = font;
                context.fillText(chars_locations[checkCoordinates(current_x, current_y)][0], current_x, current_y);
        }
    }
  
    solid_cursor = !solid_cursor;
}

function checkCoordinates(x, y) {
    if (chars_locations.length == 0) {
        return -1;
    }
    
    for (var i = 0; i < chars_locations.length; i++) {
        let set = chars_locations[i];
        if (set[1] == x && set[2] == y) {
            return i;
        }
    }
  
    return -1;
}

function updateCursor() {
    setInterval(function() { drawCursor(); }, 750);
}
