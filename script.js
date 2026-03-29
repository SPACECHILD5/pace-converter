const paceInput = document.getElementById('pace-km');
const speedInput = document.getElementById('speed-kmh');
const finishTime10kInput = document.getElementById('finishtime-10k');
const finishTimeHalfInput = document.getElementById('finishtime-half');
const finishTimeFullInput = document.getElementById('finishtime-full');

const DISTANCE_10K = 10.0;
const DISTANCE_HALF = 21.0975;
const DISTANCE_FULL = 42.195;

// Parses pace format(mm:ss) into total seconds
function parsePaceToSeconds(paceStr) {
    const parts = paceStr.split(':');
    if (parts.length !== 2) return null;
    
    const min = parseInt(parts[0], 10);
    const sec = parseInt(parts[1], 10);
    
    if (isNaN(min) || isNaN(sec) || sec >= 60 || sec < 0) return null;
    return (min * 60) + sec;
}

// Converts total seconds into pace format(mm:ss)
function formatSecondsToPace(seconds) {
    if (!seconds || seconds <= 0) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Parses finish time format(hh:mm:ss or mm:ss) into total seconds
// Returns null if minutes or seconds are out of range (>= 60)
function parseFinishTimeToSeconds(timeStr) {
    const parts = timeStr.split(':').map(p => parseInt(p, 10));
    if (parts.some(isNaN)) return null;
    if (parts.length === 3) {
        const [h, m, s] = parts;
        if (h < 0 || m < 0 || s < 0 || m >= 60 || s >= 60) return null;
        return (h * 3600) + (m * 60) + s;
    } else if (parts.length === 2) {
        const [m, s] = parts;
        // m < 10 guard: prevents mid-typing 3-digit h:mm entries (e.g. "5:30" from "530")
        // from being parsed as mm:ss. All 3 marathon distances take >= 10 minutes.
        if (s < 0 || s >= 60 || m < 10) return null;
        return (m * 60) + s;
    }
    return null;
}

// Converts total seconds into finish time format(hh:mm:ss or mm:ss)
function formatSecondsToFinishTime(seconds) {
    if (!seconds || seconds <= 0) return '';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.round(seconds % 60);
    if (hrs > 0) {
        return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Logic to update all data from Pace in min/km
function syncFromPace() {
    const paceStr = paceInput.value.trim();
    if (!paceStr) {
        clearInputs(paceInput);
        return;
    }

    const secPerKm = parsePaceToSeconds(paceStr);
    if (secPerKm) {
        const kmh = (3600 / secPerKm).toFixed(1);
        speedInput.value = kmh;
        
        finishTime10kInput.value = formatSecondsToFinishTime(secPerKm * DISTANCE_10K);
        finishTimeHalfInput.value = formatSecondsToFinishTime(secPerKm * DISTANCE_HALF);
        finishTimeFullInput.value = formatSecondsToFinishTime(secPerKm * DISTANCE_FULL);
    } else {
        clearInputs(paceInput);
    }
}

// Logic to update all data from Speed in km/h
function syncFromSpeed() {
    const kmhStr = speedInput.value.trim();
    if (!kmhStr) {
        clearInputs(speedInput);
        return;
    }

    const kmh = parseFloat(kmhStr);
    if (kmh > 0 && kmh <= 30) {
        const secPerKm = 3600 / kmh;
        paceInput.value = formatSecondsToPace(secPerKm);
        
        finishTime10kInput.value = formatSecondsToFinishTime(secPerKm * DISTANCE_10K);
        finishTimeHalfInput.value = formatSecondsToFinishTime(secPerKm * DISTANCE_HALF);
        finishTimeFullInput.value = formatSecondsToFinishTime(secPerKm * DISTANCE_FULL);
    } else {
        clearInputs(speedInput);
    }
}

// Logic to update all data from 10K Finish Time
function syncFromFinishTime10k() {
    const timeStr = finishTime10kInput.value.trim();
    if (!timeStr) {
        clearInputs(finishTime10kInput);
        return;
    }

    const totalSeconds = parseFinishTimeToSeconds(timeStr);
    if (totalSeconds) {
        const secPerKm = totalSeconds / DISTANCE_10K;
        paceInput.value = formatSecondsToPace(secPerKm);
        
        const kmh = (3600 / secPerKm).toFixed(1);
        speedInput.value = kmh;
        
        finishTimeHalfInput.value = formatSecondsToFinishTime(secPerKm * DISTANCE_HALF);
        finishTimeFullInput.value = formatSecondsToFinishTime(secPerKm * DISTANCE_FULL);
    } else {
        clearInputs(finishTime10kInput);
    }
}

// Logic to update all data from Half Marathon Finish Time  
function syncFromFinishTimeHalf() {
    const timeStr = finishTimeHalfInput.value.trim();
    if (!timeStr) {
        clearInputs(finishTimeHalfInput);
        return;
    }

    const totalSeconds = parseFinishTimeToSeconds(timeStr);
    if (totalSeconds) {
        const secPerKm = totalSeconds / DISTANCE_HALF;
        paceInput.value = formatSecondsToPace(secPerKm);
        
        const kmh = (3600 / secPerKm).toFixed(1);
        speedInput.value = kmh;
        
        finishTime10kInput.value = formatSecondsToFinishTime(secPerKm * DISTANCE_10K);
        finishTimeFullInput.value = formatSecondsToFinishTime(secPerKm * DISTANCE_FULL);
    } else {
        clearInputs(finishTimeHalfInput);
    }
}

// Logic to update all data from Full Marathon Finish Time  
function syncFromFinishTimeFull() {
    const timeStr = finishTimeFullInput.value.trim();
    if (!timeStr) {
        clearInputs(finishTimeFullInput);
        return;
    }

    const totalSeconds = parseFinishTimeToSeconds(timeStr);
    if (totalSeconds) {
        const secPerKm = totalSeconds / DISTANCE_FULL;
        paceInput.value = formatSecondsToPace(secPerKm);
        
        const kmh = (3600 / secPerKm).toFixed(1);
        speedInput.value = kmh;
        
        finishTime10kInput.value = formatSecondsToFinishTime(secPerKm * DISTANCE_10K);
        finishTimeHalfInput.value = formatSecondsToFinishTime(secPerKm * DISTANCE_HALF);
    } else {
        clearInputs(finishTimeFullInput);
    }
}

// Helper to clear other inputs when one is emptied
function clearInputs(exceptInput) {
    if (exceptInput !== paceInput) paceInput.value = '';
    if (exceptInput !== speedInput) speedInput.value = '';
    if (exceptInput !== finishTime10kInput) finishTime10kInput.value = '';
    if (exceptInput !== finishTimeHalfInput) finishTimeHalfInput.value = '';
    if (exceptInput !== finishTimeFullInput) finishTimeFullInput.value = '';
}

// Format input dynamically (auto insert colon for mm:ss)
function handlePaceInputFormatting(e) {
    let val = e.target.value.replace(/[^\d:]/g, '');
    
    if (val.length >= 3 && !val.includes(':')) {
        val = val.substring(0, val.length - 2) + ':' + val.substring(val.length - 2);
    }
    
    e.target.value = val;
}

// Validates pace on blur — clears field if format is invalid (e.g. 5:60)
function handlePaceBlur(e) {
    const val = e.target.value.trim();
    if (!val) return;
    if (parsePaceToSeconds(val) === null) {
        e.target.value = '';
        clearInputs(paceInput);
    }
}

// Formats speed input: auto-insert decimal before last digit at 3 digits, max 1 decimal, cap 30
function handleSpeedInputFormatting(e) {
    let val = e.target.value.replace(/[^\d.]/g, '');

    const dotIdx = val.indexOf('.');
    if (dotIdx === -1) {
        // No decimal: auto-insert before last digit when 3+ digits (e.g. '123' → '12.3')
        if (val.length >= 3) {
            val = val.substring(0, val.length - 1) + '.' + val.substring(val.length - 1);
        }
    } else {
        // Has decimal: limit to 1 decimal digit, remove extra dots
        const intPart = val.substring(0, dotIdx);
        const decPart = val.substring(dotIdx + 1).replace(/\./g, '').substring(0, 1);
        val = intPart + '.' + decPart;
    }

    // Cap at 30.0
    const num = parseFloat(val);
    if (!isNaN(num) && num > 30) {
        val = '30.0';
    }

    e.target.value = val;
}

// Normalizes speed to 1 decimal place on blur (e.g. '5' → '5.0')
function handleSpeedBlur(e) {
    const val = e.target.value.trim();
    if (!val) return;
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
        e.target.value = num.toFixed(1);
    }
}

// Format finish time input (auto insert colons for h:mm:ss or mm:ss)
function handleFinishTimeFormatting(e) {
    let val = e.target.value.replace(/[^\d:]/g, '');
    
    // Strip all colons and reformat based on digit count
    const digits = val.replace(/:/g, '');
    
    if (digits.length >= 5) {
        val = digits.substring(0, digits.length - 4) + ':' 
            + digits.substring(digits.length - 4, digits.length - 2) + ':' 
            + digits.substring(digits.length - 2);
    } else if (digits.length >= 3) {
        val = digits.substring(0, digits.length - 2) + ':' + digits.substring(digits.length - 2);
    } else {
        val = digits;
    }
    
    e.target.value = val;
}

// minDigits: 2 for 10K/Half (mm → mm:00), 3 for Full (skip 2-digit inputs)
function createFinishTimeBlurHandler(minDigits) {
    return function(e) {
        const val = e.target.value.trim();
        if (!val) return;

        const colons = (val.match(/:/g) || []).length;
        const digits = val.replace(/:/g, '');
        let newVal = val;

        if (colons === 0 && digits.length === 2 && minDigits <= 2) {
            newVal = `${digits}:00`;
        } else if (colons === 1) {
            newVal = val + ':00';
        }

        if (newVal !== val) {
            e.target.value = newVal;
        }

        // Invalid value (e.g. "1:60:00"): clear the field
        if (e.target.value && parseFinishTimeToSeconds(e.target.value) === null) {
            e.target.value = '';
            clearInputs(e.target);
            return;
        }

        if (newVal !== val) {
            e.target.dispatchEvent(new Event('input'));
        }
    };
}

// Triggers blur (auto-completion + sync) when Enter is pressed
function handleEnterBlur(e) {
    if (e.key === 'Enter') {
        e.target.blur();
    }
}

// Clears all fields on focus for a fresh start
function handleFocus(e) {
    e.target.value = '';
    clearInputs(null);
}

// --- Event Listeners ---

const allInputs = [paceInput, speedInput, finishTime10kInput, finishTimeHalfInput, finishTimeFullInput];
allInputs.forEach(input => input.addEventListener('focus', handleFocus));

paceInput.addEventListener('input', (e) => {
    handlePaceInputFormatting(e);
    syncFromPace();
});
paceInput.addEventListener('blur', handlePaceBlur);
paceInput.addEventListener('keydown', handleEnterBlur);

speedInput.addEventListener('input', (e) => {
    handleSpeedInputFormatting(e);
    syncFromSpeed();
});
speedInput.addEventListener('blur', handleSpeedBlur);

finishTime10kInput.addEventListener('input', (e) => {
    handleFinishTimeFormatting(e);
    syncFromFinishTime10k();
});
finishTime10kInput.addEventListener('blur', createFinishTimeBlurHandler(2));
finishTime10kInput.addEventListener('keydown', handleEnterBlur);

finishTimeHalfInput.addEventListener('input', (e) => {
    handleFinishTimeFormatting(e);
    syncFromFinishTimeHalf();
});
finishTimeHalfInput.addEventListener('blur', createFinishTimeBlurHandler(2));
finishTimeHalfInput.addEventListener('keydown', handleEnterBlur);

finishTimeFullInput.addEventListener('input', (e) => {
    handleFinishTimeFormatting(e);
    syncFromFinishTimeFull();
});
finishTimeFullInput.addEventListener('blur', createFinishTimeBlurHandler(3));
finishTimeFullInput.addEventListener('keydown', handleEnterBlur);
