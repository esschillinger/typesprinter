let solid_cursor = true;
let current_x = 65;
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
        if (acceptable_chars.includes(e.key)) {
            addText(e.key, "white");
        } else if (e.key === "Backspace") {
            addText(e.key, "black");
        }
        console.log(e.key);
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
    
    //if (solid_cursor) { //                      For whatever reason, if I force-clear the cursor every time it works but it doesn't work if I only clear when solid_cursor = true... whatever it works now
        //console.log("Cleared cursor?");
        context.fillStyle = "black";
        context.fillRect(current_x, current_y - 33, cursor_width, cursor_height);
    //}
  
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
        //context.fillText(chars_locations[i][0], chars_locations[i][1], chars_locations[i][2]);
        //console.log(chars_locations[i][0] + " (" + chars_locations[i][1] + ", " + chars_locations[i][2] + ")");
        
        let removed_character = chars_locations.pop();
        current_x = removed_character[1];
        current_y = removed_character[2];
        
        context.fillStyle = "white";
        context.fillRect(current_x, current_y - 33, cursor_width, cursor_height); //Keep moving the cursor back
    }
}

function drawCursor() {
    var canvas_main = document.getElementById("canvas-terminal-body");
    var context = canvas_main.getContext("2d");
    
    context.fillStyle = "white";
    if (!solid_cursor) {
        context.fillStyle = "black";
        //context.fillRect(x + (width * 0.1), y - 30 + (width * 0.1), width * 0.8, height - 2 * (width * 0.1));        THIS IS FOR WHEN THE TERMINAL ISN'T FOCUSED
    }
    
    context.fillRect(current_x, current_y - 33, cursor_width, cursor_height);
    
    if (solid_cursor) {
        solid_cursor = false;
    } else {
        solid_cursor = true;
    }
}

function updateCursor() {
    setInterval(function() { drawCursor(); }, 750);
}
