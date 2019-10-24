function load_canvas() {
    var canvas = document.getElementById("canvas_terminal");
    var context = canvas.getContext("2d");
    
    drawCircle(20, 20, 10, "#ff6159", context);
    drawCircle(50, 20, 10, "#febf2d", context);
    drawCircle(80, 20, 10, "#29cd42", context);
    
    context.font = "25px Ubuntu Mono";
    context.fillStyle = "black";
    context.fillText("tph/bash", 450, 27.5);
}

//makes a circle of radius r with center {x, y} parameterized in the counterclockwise direction
function drawCircle(x, y, r, color, context) {
    context.beginPath();
    context.arc(x, y, r, 0, 2 * Math.PI, true);
    context.fillStyle = color;
    context.fill();
}
