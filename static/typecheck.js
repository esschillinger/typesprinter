let original_passage = "";
let user_progress = "";
let socket_conn = "";
let room_id = "";
let prev_length = 0;
let conn = "";
let correct = "";
let incorrect = "";
let incomplete = "";
let wpm_counter = "";
let start = false;
let error_index = -1;
let ti = 0;
let tf = -1;
let times = [];
let adjusted_times = [];
let word_wpms = [];
let num_categories = 5;
let category_wpms = [];
let wpm_style = "";
let race_commands = "";
let rainbow_colors = ["red", "orange", "yellow",
                     "green", "blue", "indigo",
                     "violet"];

function load(first, second, third) {
    original_passage = first + second + third;
    conn = document.getElementById("user_input");
    correct = document.getElementById("correct");
    incorrect = document.getElementById("incorrect");
    incomplete = document.getElementById("incomplete");
    wpm_counter = document.getElementById("wpm_counter");

    let commands = document.getElementById("hidden-commands").innerHTML;
    if (commands != "") {
        if (commands.includes("wpm -rb")) {
            wpm_style += "rainbow";
        }
        if (commands.includes("wpm -sz")) {
            wpm_style += "size";
        }
        if (commands.includes("autowin")) {
            race_commands += "autowin";
        }
    }

    $('input#user_input').focus();
}

function loadSocket(socket, room) {
    socket_conn = socket;
    room_id = room;
}

function check() {
    if (start != true) {
        start = true;
        ti = Date.now();
    }

    tf = Date.now();

    // Apply visual cheats
    if (wpm_style.includes("rainbow")) {
        wpm_counter.style.color = rainbow_colors[Math.floor(Math.random() * rainbow_colors.length)];
    }
    if (wpm_style.includes("size")) {
        wpm_counter.style.fontSize = "" + (100 + Math.floor(Math.random() * 151)) + "px";
    }

    wpm_counter.innerHTML = Math.ceil((user_progress.length / 5) / (((tf - ti)/60000)));

    let value = conn.value;

    //current_text = document.getElementById("user_input").value;

    if (value.length == 0) {
        if (error_index != -1) {
            correct.innerHTML = original_passage.substring(0, correct.innerHTML.length - (error_index - user_progress.length));
        } else {
            correct.innerHTML = original_passage.substring(0, correct.innerHTML.length - prev_length)
        }

        incorrect.innerHTML = "";
        incomplete.innerHTML = original_passage.substring(correct.innerHTML.length);
        error_index = -1;
        conn.style.backgroundColor = "transparent";
        prev_length = 0;

        return;
    } else if ((value.length == 1 && value[0] == " ") || Math.abs(value.length - prev_length) > 3) { // Ideally Math.abs(...) > 1 to eliminate copy-paste but we don't live in a perfect world -- code doesn't run enough times/second to identify two keys being pressed "at once" as valid input
        conn.value = "";
        prev_length = 0;
        return;
    }

    let offset = user_progress.length
    for (var ch = 0; ch < value.length; ch++) {
        if (race_commands.includes("autowin")) {
            value = original_passage.substring(offset, offset + value.length);
            conn.value = value;
        }
        if (original_passage[offset + ch] != value[ch]) {
            error_index = offset + ch;

            conn.style.backgroundColor = "#bc3f5c";
            correct.innerHTML = original_passage.substring(0, error_index);
            incorrect.innerHTML = original_passage.substring(error_index, offset + value.length);
            incomplete.innerHTML = original_passage.substring(offset + value.length);
            prev_length = value.length;
            return;
        }

        error_index = -1;
        conn.style.backgroundColor = "transparent";
        correct.innerHTML = original_passage.substring(0, offset + value.length);
        incorrect.innerHTML = "";
        incomplete.innerHTML = original_passage.substring(offset + value.length);

        if (ch == value.length - 1) {
            if (value[ch] == " ") {
                user_progress += value;
                times.push(Date.now() / 60000);
                conn.value = "";
            } else if (user_progress + value == original_passage) {
                tf = Date.now();
                let tWPM = (tf - ti) / 60000;

                user_progress += value;
                times.push(Date.now() / 60000);
                let WPM = Math.ceil((user_progress.length / 5) / tWPM);

                conn.value = "";
                document.getElementById("end_message").innerHTML = "Race finished in " + Math.round(tWPM * 60) + "s at a rate of " + WPM + " WPM.";
                document.getElementById("wpm_counter").innerHTML = WPM;
                document.getElementById("div-links").style.display = "block";
                conn.style.display = "none";

                if (socket_conn != "") {
                    socket_conn.emit('race finished', {
                        room: room_id
                    });
                }

                statsAnalysis(WPM);
            }
        }
    }

    prev_length = conn.value.length;
}

function statsAnalysis(WPM) {
    let passage_list = original_passage.split(" ");

    document.getElementById("speed-breakdown-key").style.display = "block";

    let std_dev = speedsHeatmap(WPM, passage_list);
    speedsGraph(category_wpms, word_wpms, std_dev);

    // TODO: FILL IN POINTS FOR THE GRAPH (FOR LOOP OVER word_wpms THAT CREATES A SPHERE AT (<incremented x-value>, canvas.height - word_wpms[l]) AND DRAW IN A SINGLE LINE THAT CONNECTS THEM (POPULATE A LIST OF COORDINATES AS YOU GO OVER THE FIRST LOOP AND JUST MAKE A LINE CONNECTING EACH COORDINATE))
}

function speedsHeatmap(WPM, passage_list) {
    let speeds = document.getElementById("speed-breakdown-text");
    speeds.width = "800"; //document.getElementById("passage").style.width;
    speeds.height = "400"; //document.getElementById("passage").style.height;
    speeds.style.display = "block";

    let context = speeds.getContext("2d");

    let current_x = 0;
    let current_y = 20;
    let bkg_width = 10;
    let bkg_height = 20;
    let space_width = 15;

    for (var i = 0; i < times.length; i++) {
        if (i == 0) {
            adjusted_times.push(times[i] - (ti / 60000));
        } else {
            adjusted_times.push(times[i] - times[i - 1]);
        }

        word_wpms.push((passage_list[i].length / 5) / adjusted_times[i]);
    }







    // WORK ON THIS BLOCK OF CODE--YOU NEED TO SPLIT UP THE PASSAGE INTO <num_categories> INTERVALS TO MAKE PLOTTING MORE CONSISTENT







    let l_interval = Math.floor(times.length / num_categories); // Length of a standard interval
    let remainder = times.length % num_categories; // Remainder

    let start = 0;
    let stop = 0;
    for (var g = 0; g < passage_list.length; g++) {
        if (g != 0 && ((g - start) % (l_interval - 1) == 0)) { // If g is where the end of an interval should be
            stop = g;
            if (remainder > 0) {
                stop++;
                remainder--;
            }
            let length = 0; // Total character length over the interval
            for (var h = start; h <= stop; h++) {
                length += passage_list[h].length;
            }

            length += (stop - start); // Add the number of spaces to the characters typed

            let time_interval = -1;

            if (start == 0) {
                time_interval = times[stop] - (ti / 60000);
            } else {
                time_interval = times[stop] - times[start - 1];
            }

            category_wpms.push((length / 5) / time_interval);
            start = stop + 1;
            g = start;
        }
    }

    let mean = WPM;

    let summation = 0;
    for (var j = 0; j < word_wpms.length; j++) {
        summation += Math.pow(word_wpms[j] - mean, 2);
    }
    let std_dev = Math.sqrt(summation / (word_wpms.length - 1));

    let temp_x = 0;
    let temp_y = 20;
    for (var h = 0; h < passage_list.length; h++) {
        temp_x += passage_list[h].length * bkg_width + space_width;
        if ((h < passage_list.length - 1) && (temp_x + passage_list[h].length * bkg_width + space_width > speeds.width)) {
            temp_x = 0;
            temp_y += 25;
        }
    }

    speeds.height = (temp_y + 25).toString();
    context.font = "20px Consolas, Menlo, Monaco, Lucida Console, Liberation Mono, DejaVu Sans Mono, Bitstream Vera Sans Mono, Courier New, monospace, serif"; // TODO: Change to .friendly-font

    for (var k = 0; k < adjusted_times.length; k++) {
        if (word_wpms[k] > mean + (3 * std_dev / 4)) { // Super fast                                CHANGE SPEED DISTINCTIONS TO BE IN TERMS OF THE STD. DEV.
            context.fillStyle = "#3f8e68";
        } else if (word_wpms[k] > mean) { // Fast
            context.fillStyle = "#a0d58c";
        } else if (word_wpms[k] + (3 * std_dev / 4) < WPM) { // Super slow
            context.fillStyle = "#bc3f5c";
        } else if (word_wpms[k] < WPM) { // Slow
            context.fillStyle = "#ea7664";
        }

        let rectangle_width = 0;
        if (k < times.length - 1) {
            rectangle_width = bkg_width * passage_list[k].length + space_width;
        } else {
            rectangle_width = bkg_width * passage_list[k].length;
        }

        //context.fillRect(current_x, current_y - (0.75 * bkg_height), rectangle_width, bkg_height);

        //context.fillStyle = "black";
        context.fillText(passage_list[k], current_x, current_y);

        current_x += passage_list[k].length * bkg_width + space_width;
        if ((k < times.length - 1) && (current_x + (passage_list[k + 1].length * bkg_width + space_width) > speeds.width)) {
            current_x = 0;
            current_y += 25;
        }
    }

    return std_dev;
}

function speedsGraph(interval, instantaneous, std_dev) {
    let graph = document.getElementById("speed-graph-interval");
    graph.style.display = "block";
    graph.width = "600";
    graph.height = "300";

    createGraph(graph, interval, [std_dev]);

    graph = document.getElementById("speed-graph-instantaneous");
    graph.style.display = "block";
    graph.width = "600";
    graph.height = "300";

    createGraph(graph, instantaneous, [std_dev]);
}

function createGraph(elem, wpms, stats) {
    context = elem.getContext("2d");
    context.fillStyle = "black";

    context.beginPath(); // Draw axes
    context.moveTo(0, 0);
    context.lineTo(0, 300);
    context.lineTo(600, 300);
    context.stroke();

    let max = wpms[0];
    let min = wpms[0];
    for (var i = 1; i < wpms.length; i++) {
        if (wpms[i] > max) {
            max = wpms[i];
        } else if (wpms[i] < min) {
            min = wpms[i];
        }
    }

    let upper = max + stats[0] / 4;
    let lower = 0;
    if (min - stats[0] / 4 > 0) {
        lower = min - stats[0] / 4;
    }

    context.font = "15px Consolas, Menlo, Monaco, Lucida Console, Liberation Mono, DejaVu Sans Mono, Bitstream Vera Sans Mono, Courier New, monospace, serif";
    context.fillText(upper.toString(), 10, 20);
    context.fillText(lower.toString(), 10, elem.height - 10)

    let interval_length = Math.floor(elem.width / wpms.length);
    //let vertical_scale = Math.floor(elem.height / (upper - lower));

    let point_x = 0;
    let point_y = elem.height;
    let point_coords = [];
    for (var j = 0; j < wpms.length; j++) {
        point_coords.push([point_x, point_y - (((wpms[j] - lower) / (upper - lower)) * (point_y))]);
        drawCircle(point_x, point_coords[j][1], 3, "black", context);
        point_x += interval_length;
    }

    context.beginPath();
    context.moveTo(point_coords[0][0], point_coords[0][1]);
    for (var k = 0; k < point_coords.length; k++) {
        context.lineTo(point_coords[k][0], point_coords[k][1]);
    }

    context.stroke();
}

function drawCircle(x, y, r, color, context) {
    context.beginPath();
    context.arc(x, y, r, 0, 2 * Math.PI, true);
    context.fillStyle = color;
    context.fill();
}
