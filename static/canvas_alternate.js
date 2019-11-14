let canvas_main = "";
let context = "";
let solid_cursor = true;
let current_x = 65; // Use current_x and current_y to keep track of cursor position instead of character position
let current_y = 40;
let canvas_width = 1000;
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
            addCharacter(e.key, "white");
        } else if (e.key === "Backspace") {
            removeCharacter();
        } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
            moveCursor(e.key.substring(5));
        }
    });
}

function addCharacter(character) {
    chars_locations.push([character, current_x, current_y]);
    current_x += character_width + space_width;
    if (current_x + character_width + space_width >= canvas_width) {
        current_x = 65;
        current_y += 40;
    }
  
    writeCanvas();
}

function removeCharacter() {
    let index = checkCoordinates(current_x - space_width, current_y) // Must also account for if the previous character is the last character of the line above
    for (var i = 0; i < chars_locations.length; i++) {
        let set = chars_locations[i];
        if (set[1] + space_width + character_width == current_x && set[2] == current_y) {
            chars_locations.splice(i, 1); // Remove 1 element at position i
        }
    }
  
    writeCanvas();
}

function moveCursor() {
    current_x -= (character_width + space_width);
    if (current_x < 65) {
        current_x = 65;
        current_y -= 40;
    }
    
    drawCursor();
}

function writeCanvas() {
    
}

function drawCursor() {
    
}

function checkCoordinates(x, y) {
    for (var i = 0; i < chars_locations.length; i++) {
        let set = chars_locations[i];
        if (set[1] + space_width + character_width == x && set[2] == y) {
            return i;
        }
    }
  
    return -1;
}
