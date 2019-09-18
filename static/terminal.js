let width = 0;
let conn1 = "";
let conn2 = "";

function load() {
    conn1 = document.getElementById("term_command");
    conn2 = document.getElementById("term_command_end");
}

function stretch() {
    let value = conn1.value;
    let length = value.length;
    
    if (length == 0) {
        width = 5;
        offset = 0;
    } else {
        width = length * 30;
        offset = width - (5 * length);
    }
    
    conn1.style.width = width.toString(10) + "px";
    conn2.style.marginLeft = offset.toString(10) + "px";
}
