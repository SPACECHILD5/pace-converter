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
function parseFinishTimeToSeconds(timeStr) {
    const parts = timeStr.split(':').map(p => parseInt(p, 10));
    if (parts.some(isNaN)) return null;
    if (parts.length === 3) {
        return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
    } else if (parts.length === 2) {
        return (parts[0] * 60) + parts[1];
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
    if (kmh > 0) {
        const secPerKm = 3600 / kmh;
        paceInput.value = formatSecondsToPace(secPerKm);
        
        finishTime10kInput.value = formatSecondsToFinishTime(secPerKm * DISTANCE_10K);
        finishTimeHalfInput.value = formatSecondsToFinishTime(secPerKm * DISTANCE_HALF);
        finishTimeFullInput.value = formatSecondsToFinishTime(secPerKm * DISTANCE_FULL);
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
    }
}

// Logic to update all data from Full Marathon Finish Time  
function syncFromFull() {
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

paceInput.addEventListener('input', (e) => {
    handlePaceInputFormatting(e);
    syncFromPace();
});

speedInput.addEventListener('input', syncFromSpeed);

finishTime10kInput.addEventListener('input', (e) => {
    handleFinishTimeFormatting(e);
    syncFromFinishTime10k();
});

finishTimeHalfInput.addEventListener('input', (e) => {
    handleFinishTimeFormatting(e);
    syncFromFinishTimeHalf();
});

finishTimeFullInput.addEventListener('input', (e) => {
    handleFinishTimeFormatting(e);
    syncFromFull();
});
