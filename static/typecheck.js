let original_passage = "";
let user_progress = "";
let prev_length = 0;
let conn = "";
let correct = "";
let incorrect = "";
let incomplete = "";
let start = false;
let error_index = -1;
let ti = 0;
let tf = -1;

function load(first, second, third) {
    original_passage = first + second + third;
    conn = document.getElementById("user_input");
    correct = document.getElementById("correct");
    incorrect = document.getElementById("incorrect");
    incomplete = document.getElementById("incomplete");
}

function check() {
    if (start != true) {
        start = true;
        ti = performance.now();
    }
    
    let value = conn.value;
    
    current_text = document.getElementById("user_input").value;
    
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
        if (original_passage[offset + ch] != value[ch]) {
            //conn.value = conn.value.substring(0, ch);
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
                conn.value = "";
            } else if (user_progress + value == original_passage) {
                tf = performance.now();
                let ttotal = tf - ti;
                let tWPM = ttotal / 60000;
                
                user_progress += value;
                conn.value = "";
                document.getElementById("end_message").innerHTML = "Race finished in " + Math.round(tWPM * 60) + "s at a rate of " + Math.ceil((user_progress.length / 5) / tWPM) + " WPM."
            }
        }
    }
    
    prev_length = conn.value.length;
}
