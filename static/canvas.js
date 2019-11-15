let solid_cursor = true;
let hollow_cursor = false;
let current_x = 65;
let current_y = 40;
let canvas_width = 1000;
let character_width = 20;
let space_width = 5;
let cursor_width = 20;
let cursor_height = 40;
let cursor_x = current_x;
let cursor_y = current_y;
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
    var context = canvas_top.getContext("2d");
    
    drawCircle(20, 20, 10, "#ff6159", context);
    drawCircle(50, 20, 10, "#febf2d", context);
    drawCircle(80, 20, 10, "#29cd42", context);
    
    context.font = "25px Ubuntu Mono";
    context.fillStyle = "black";
    context.fillText("tph/bash", 450, 27.5);
  
    var canvas_main = document.getElementById("canvas-terminal-body");
    context = canvas_main.getContext("2d");
    
    context.font = font;
    context.fillStyle = "white";
    context.fillText("$", 25, 40);
    
    document.addEventListener('keydown', (e) => {
        if (acceptable_chars.includes(e.key.toLowerCase())) {
            addText(e.key, "white");
        } else if (e.key === "Backspace") {
            addText(e.key, "black");
        }
    });
    
    document.addEventListener('click', function() {
        //console.log(document.activeElement);
        //console.log(document.getElementById("canvas-terminal-body"));
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
    
    context.fillStyle = "black";
    context.fillRect(current_x, current_y - 33, cursor_width, cursor_height);
  
    context.font = font;
    context.fillStyle = color;
    
    if (color == "white") {
        context.fillText(character, current_x, current_y);
        chars_locations.push([character, current_x, current_y]);
        
        current_x += character_width + space_width;
        console.log(character + " (" + current_x + ", " + current_y + ")");
        if (current_x + space_width + cursor_width >= canvas_width) {
            current_x = 65;
            current_y += 40;
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
        context.fillStyle = "black";
    }
    
    context.fillRect(x, y - 33, cursor_width, cursor_height);
    let index = checkCoordinates(x, y);
    if (index != -1) {
        if (solid_cursor) {
            context.fillStyle = "black";
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
    context.fillStyle = "black";
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

function updateCursor() {
    setInterval(function() { 
        if (!hollow_cursor) {
            drawCursor(current_x, current_y);
        } else {
            drawHollowCursor(current_x, current_y);
        }
    }, 750);
}
