function load_canvas() {
    var canvas = document.getElementById("canvas_terminal");
    var context = canvas.getContext("2d");

    context.beginPath();
    context.arc(20, 20, 10, 0, 2*Math.PI);
    context.fillStyle = "#ff6159";
    context.fill();

    context.beginPath();
    context.arc(50, 20, 10, 0, 2*Math.PI);
    context.fillStyle = "#febf2d";
    context.fill();

    context.beginPath();
    context.arc(80, 20, 10, 0, 2*Math.PI);
    context.fillStyle = "#29cd42";
    context.fill();
    
    context.font = "25px Ubuntu Mono";
    context.fillStyle = "black";
    context.fillText("tph/bash", 450, 27.5);
}
