let original_passage = "";
let user_progress = "";
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
        //console.log(commands);
        if (commands.includes("wpm-rainbow")) {
            //console.log(true);
            wpm_style += "rainbow";
        }
        if (commands.includes("wpm-size")) {
            wpm_style += "size";
        }
        if (commands.includes("chars-correct")) {
            race_commands += "correct";
        }
    }
}









// Add loads more statistical measures: mean wpm (already given), std. dev, smooth curve of wpm/time, light/dark green/red highlighting of original passage to indicate portions above/well above/below/well below the mean, etc









function check() {
    if (start != true) {
        start = true;
        ti = performance.now();
    }
  
    tf = performance.now();
    
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
        if (race_commands.includes("correct")) {
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
                times.push(performance.now() / 60000);
                conn.value = "";
            } else if (user_progress + value == original_passage) {
                tf = performance.now();
                let tWPM = (tf - ti) / 60000;
              
                user_progress += value;
                times.push(performance.now() / 60000);
                let WPM = Math.ceil((user_progress.length / 5) / tWPM);
                
                conn.value = "";
                document.getElementById("end_message").innerHTML = "Race finished in " + Math.round(tWPM * 60) + "s at a rate of " + WPM + " WPM.";
                document.getElementById("wpm_counter").innerHTML = WPM;
                document.getElementById("div-links").style.display = "block";
                conn.style.display = "none";
                
                let passage_list = original_passage.split(" ");
                
                document.getElementById("speed-breakdown-key").style.display = "block";
                
                let speeds = document.getElementById("speed-breakdown");
                speeds.width = "800"; //document.getElementById("passage").style.width;
                speeds.height = "400"; //document.getElementById("passage").style.height;
                speeds.style.display = "block";
              
                let context = speeds.getContext("2d");
                context.font = "20px Ubuntu Mono"; // Change to .friendly-font
                
                let current_x = 0;
                let current_y = 30;
                let bkg_width = 10;
                let bkg_height = 20;
                let space_width = 3;
                
                for (var i = 0; i < times.length; i++) {
                    if (i == 0) {
                        adjusted_times.push(times[i] - (ti / 60000));
                    } else {
                        adjusted_times.push(times[i] - times[i - 1]);
                    }
                    
                    word_wpms.push((passage_list[i].length / 5) / adjusted_times[i]);
                }
                
                console.log(adjusted_times);
                console.log(word_wpms);
                
                let mean = WPM;
              
                let summation = 0;
                for (var j = 0; j < word_wpms.length; j++) {
                    summation += Math.pow(word_wpms[j] - mean, 2);
                }
                let std_dev = Math.sqrt(summation / (word_wpms.length - 1));
                
                console.log("μ = " + mean + ", σ = " + std_dev);
                
                for (var k = 0; k < adjusted_times.length; k++) {
                    if (word_wpms[k] > mean + (3 * std_dev / 4)) { // Super fast                                CHANGE SPEED DISTINCTIONS TO BE IN TERMS OF THE STD. DEV.
                        context.fillStyle = "#3f8e68";
                    } else if (word_wpms[k] > mean) { // Fast
                        context.fillStyle = "#a0d58c";
                    } else if (word_wpms[k] + (3 * std_dev / 4 < WPM)) { // Super slow
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
                    
                    context.fillRect(current_x, current_y - (0.75 * bkg_height), rectangle_width, bkg_height);
                  
                    context.fillStyle = "black";
                    context.fillText(passage_list[k], current_x, current_y);
                  
                    current_x += passage_list[k].length * bkg_width + space_width;
                    if ((k < times.length - 1) && (current_x + (passage_list[k + 1].length * bkg_width) > speeds.width)) {
                        current_x = 0;
                        current_y += 25;
                    }
                }
            }
        }
    }
    
    prev_length = conn.value.length;
}
