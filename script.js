const paceInput = document.getElementById('pace-km');
const speedInput = document.getElementById('speed-kmh');
const finishTime10kInput = document.getElementById('finishtime-10k');
const finishTimeHalfInput = document.getElementById('finishtime-half');
const finishTimeFullInput = document.getElementById('finishtime-full');

const appStage = document.getElementById('app-stage');
const track = document.getElementById('track');
const pages = document.querySelectorAll('.page');
const dots = document.querySelectorAll('.dot');

const addWorkoutRowButton = document.getElementById('add-workout-row');
const workoutRows = Array.from(document.querySelectorAll('.workout-row'));
const workoutPaceInputs = Array.from(document.querySelectorAll('.workout-pace-input'));
const workoutBox = document.querySelector('.workout-box');

const DISTANCE_10K = 10.0;
const DISTANCE_HALF = 21.0975;
const DISTANCE_FULL = 42.195;

const converterState = {
    activeField: null,
};

const structuredWorkoutRows = [
    { id: 1, pace: '', speed: '' },
    { id: 2, pace: '', speed: '' },
    { id: 3, pace: '', speed: '' },
    { id: 4, pace: '', speed: '' },
];

let visibleWorkoutRows = 3;

function parsePaceToSeconds(paceStr) {
    const parts = paceStr.split(':');
    if (parts.length !== 2) return null;

    const min = parseInt(parts[0], 10);
    const sec = parseInt(parts[1], 10);

    if (isNaN(min) || isNaN(sec) || sec >= 60 || sec < 0) return null;
    return (min * 60) + sec;
}

function formatSecondsToPace(seconds) {
    if (!seconds || seconds <= 0) return '';
    const roundedSeconds = Math.round(seconds);
    const mins = Math.floor(roundedSeconds / 60);
    const secs = roundedSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function parseFinishTimeToSeconds(timeStr) {
    const parts = timeStr.split(':').map((part) => parseInt(part, 10));
    if (parts.some(isNaN)) return null;

    if (parts.length === 3) {
        const [hours, mins, secs] = parts;
        if (hours < 0 || mins < 0 || secs < 0 || mins >= 60 || secs >= 60) {
            return null;
        }
        return (hours * 3600) + (mins * 60) + secs;
    }

    if (parts.length === 2) {
        const [mins, secs] = parts;
        if (secs < 0 || secs >= 60 || mins < 10) return null;
        return (mins * 60) + secs;
    }

    return null;
}

function formatSecondsToFinishTime(seconds) {
    if (!seconds || seconds <= 0) return '';

    const roundedSeconds = Math.round(seconds);
    const hrs = Math.floor(roundedSeconds / 3600);
    const mins = Math.floor((roundedSeconds % 3600) / 60);
    const secs = roundedSeconds % 60;

    if (hrs > 0) {
        return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function formatPaceInputValue(value) {
    let formatted = value.replace(/[^\d:]/g, '');
    if (formatted.length >= 3 && !formatted.includes(':')) {
        formatted = `${formatted.substring(0, formatted.length - 2)}:${formatted.substring(formatted.length - 2)}`;
    }
    return formatted;
}

function formatSpeedInputValue(value) {
    let formatted = value.replace(/[^\d.]/g, '');
    const dotIndex = formatted.indexOf('.');

    if (dotIndex === -1) {
        if (formatted.length >= 3) {
            formatted = `${formatted.substring(0, formatted.length - 1)}.${formatted.substring(formatted.length - 1)}`;
        }
    } else {
        const intPart = formatted.substring(0, dotIndex);
        const decPart = formatted.substring(dotIndex + 1).replace(/\./g, '').substring(0, 1);
        formatted = `${intPart}.${decPart}`;
    }

    const speed = parseFloat(formatted);
    if (!isNaN(speed) && speed > 30) {
        return '30.0';
    }

    return formatted;
}

function formatFinishTimeInputValue(value) {
    let formatted = value.replace(/[^\d:]/g, '');
    const digits = formatted.replace(/:/g, '');

    if (digits.length >= 5) {
        formatted = `${digits.substring(0, digits.length - 4)}:${digits.substring(digits.length - 4, digits.length - 2)}:${digits.substring(digits.length - 2)}`;
    } else if (digits.length >= 3) {
        formatted = `${digits.substring(0, digits.length - 2)}:${digits.substring(digits.length - 2)}`;
    } else {
        formatted = digits;
    }

    return formatted;
}

function normalizeFinishTimeOnBlur(input, minDigits) {
    const value = input.value.trim();
    if (!value) return false;

    const colons = (value.match(/:/g) || []).length;
    const digits = value.replace(/:/g, '');
    let nextValue = value;

    if (colons === 0 && digits.length === 2 && minDigits <= 2) {
        nextValue = `${digits}:00`;
    } else if (colons === 1) {
        nextValue = `${value}:00`;
    }

    if (nextValue !== value) {
        input.value = nextValue;
        return true;
    }

    return false;
}

function calculateSpeedFromPace(paceStr) {
    const secPerKm = parsePaceToSeconds(paceStr);
    if (!secPerKm) return '';
    return (3600 / secPerKm).toFixed(1);
}

function clearConverterFields(exceptInput) {
    if (exceptInput !== paceInput) paceInput.value = '';
    if (exceptInput !== speedInput) speedInput.value = '';
    if (exceptInput !== finishTime10kInput) finishTime10kInput.value = '';
    if (exceptInput !== finishTimeHalfInput) finishTimeHalfInput.value = '';
    if (exceptInput !== finishTimeFullInput) finishTimeFullInput.value = '';
}

function syncFromPace() {
    const paceStr = paceInput.value.trim();
    if (!paceStr) {
        clearConverterFields(paceInput);
        return;
    }

    const secPerKm = parsePaceToSeconds(paceStr);
    if (!secPerKm) {
        clearConverterFields(paceInput);
        return;
    }

    speedInput.value = (3600 / secPerKm).toFixed(1);
    finishTime10kInput.value = formatSecondsToFinishTime(secPerKm * DISTANCE_10K);
    finishTimeHalfInput.value = formatSecondsToFinishTime(secPerKm * DISTANCE_HALF);
    finishTimeFullInput.value = formatSecondsToFinishTime(secPerKm * DISTANCE_FULL);
}

function syncFromSpeed() {
    const speedStr = speedInput.value.trim();
    if (!speedStr) {
        clearConverterFields(speedInput);
        return;
    }

    const speed = parseFloat(speedStr);
    if (!(speed > 0 && speed <= 30)) {
        clearConverterFields(speedInput);
        return;
    }

    const secPerKm = 3600 / speed;
    paceInput.value = formatSecondsToPace(secPerKm);
    finishTime10kInput.value = formatSecondsToFinishTime(secPerKm * DISTANCE_10K);
    finishTimeHalfInput.value = formatSecondsToFinishTime(secPerKm * DISTANCE_HALF);
    finishTimeFullInput.value = formatSecondsToFinishTime(secPerKm * DISTANCE_FULL);
}

function syncFromFinishTime10k() {
    const totalSeconds = parseFinishTimeToSeconds(finishTime10kInput.value.trim());
    if (!totalSeconds) {
        clearConverterFields(finishTime10kInput);
        return;
    }

    const secPerKm = totalSeconds / DISTANCE_10K;
    paceInput.value = formatSecondsToPace(secPerKm);
    speedInput.value = (3600 / secPerKm).toFixed(1);
    finishTimeHalfInput.value = formatSecondsToFinishTime(secPerKm * DISTANCE_HALF);
    finishTimeFullInput.value = formatSecondsToFinishTime(secPerKm * DISTANCE_FULL);
}

function syncFromFinishTimeHalf() {
    const totalSeconds = parseFinishTimeToSeconds(finishTimeHalfInput.value.trim());
    if (!totalSeconds) {
        clearConverterFields(finishTimeHalfInput);
        return;
    }

    const secPerKm = totalSeconds / DISTANCE_HALF;
    paceInput.value = formatSecondsToPace(secPerKm);
    speedInput.value = (3600 / secPerKm).toFixed(1);
    finishTime10kInput.value = formatSecondsToFinishTime(secPerKm * DISTANCE_10K);
    finishTimeFullInput.value = formatSecondsToFinishTime(secPerKm * DISTANCE_FULL);
}

function syncFromFinishTimeFull() {
    const totalSeconds = parseFinishTimeToSeconds(finishTimeFullInput.value.trim());
    if (!totalSeconds) {
        clearConverterFields(finishTimeFullInput);
        return;
    }

    const secPerKm = totalSeconds / DISTANCE_FULL;
    paceInput.value = formatSecondsToPace(secPerKm);
    speedInput.value = (3600 / secPerKm).toFixed(1);
    finishTime10kInput.value = formatSecondsToFinishTime(secPerKm * DISTANCE_10K);
    finishTimeHalfInput.value = formatSecondsToFinishTime(secPerKm * DISTANCE_HALF);
}

function handleConverterFocus(event) {
    converterState.activeField = event.target.id;
    event.target.value = '';
    clearConverterFields(null);
}

function handlePaceBlur(event) {
    const value = event.target.value.trim();
    if (!value) return;
    if (parsePaceToSeconds(value) === null) {
        event.target.value = '';
        clearConverterFields(paceInput);
    }
}

function handleSpeedBlur(event) {
    const value = event.target.value.trim();
    if (!value) return;

    const speed = parseFloat(value);
    if (!isNaN(speed) && speed > 0) {
        event.target.value = speed.toFixed(1);
    } else {
        event.target.value = '';
        clearConverterFields(speedInput);
    }
}

function handleEnterBlur(event) {
    if (event.key === 'Enter') {
        event.target.blur();
    }
}

function updateWorkoutRowVisibility() {
    workoutRows.forEach((row, index) => {
        row.classList.toggle('is-hidden', index + 1 > visibleWorkoutRows);
    });
    addWorkoutRowButton.disabled = visibleWorkoutRows >= 4;
    if (workoutBox) {
        workoutBox.classList.toggle('is-compact', visibleWorkoutRows >= 4);
        workoutBox.dataset.rowCount = String(visibleWorkoutRows);
    }
}

function updateWorkoutRowSpeed(rowId) {
    const row = structuredWorkoutRows.find((item) => item.id === rowId);
    const output = document.querySelector(`[data-speed-for="${rowId}"]`);
    if (!row || !output) return;
    output.textContent = row.speed || '--';
}

function attachWorkoutInputHandlers() {
    workoutPaceInputs.forEach((input) => {
        input.addEventListener('input', (event) => {
            const rowId = Number(event.target.id.split('-').pop());
            const formattedPace = formatPaceInputValue(event.target.value);
            event.target.value = formattedPace;

            const row = structuredWorkoutRows.find((item) => item.id === rowId);
            if (!row) return;

            row.pace = formattedPace;
            row.speed = calculateSpeedFromPace(formattedPace);
            updateWorkoutRowSpeed(rowId);
        });

        input.addEventListener('blur', (event) => {
            const rowId = Number(event.target.id.split('-').pop());
            const row = structuredWorkoutRows.find((item) => item.id === rowId);
            if (!row) return;

            if (event.target.value && parsePaceToSeconds(event.target.value) === null) {
                event.target.value = '';
                row.pace = '';
                row.speed = '';
                updateWorkoutRowSpeed(rowId);
            }
        });

        input.addEventListener('keydown', handleEnterBlur);
    });

    addWorkoutRowButton.addEventListener('click', () => {
        if (visibleWorkoutRows < 4) {
            visibleWorkoutRows += 1;
            updateWorkoutRowVisibility();
        }
    });
}


function attachConverterHandlers() {
    const converterInputs = [paceInput, speedInput, finishTime10kInput, finishTimeHalfInput, finishTimeFullInput];
    converterInputs.forEach((input) => input.addEventListener('focus', handleConverterFocus));

    paceInput.addEventListener('input', (event) => {
        event.target.value = formatPaceInputValue(event.target.value);
        syncFromPace();
    });
    paceInput.addEventListener('blur', handlePaceBlur);
    paceInput.addEventListener('keydown', handleEnterBlur);

    speedInput.addEventListener('input', (event) => {
        event.target.value = formatSpeedInputValue(event.target.value);
        syncFromSpeed();
    });
    speedInput.addEventListener('blur', handleSpeedBlur);
    speedInput.addEventListener('keydown', handleEnterBlur);

    finishTime10kInput.addEventListener('input', (event) => {
        event.target.value = formatFinishTimeInputValue(event.target.value);
        syncFromFinishTime10k();
    });
    finishTime10kInput.addEventListener('blur', () => {
        const updated = normalizeFinishTimeOnBlur(finishTime10kInput, 2);
        if (finishTime10kInput.value && parseFinishTimeToSeconds(finishTime10kInput.value) === null) {
            finishTime10kInput.value = '';
            clearConverterFields(finishTime10kInput);
            return;
        }
        if (updated) syncFromFinishTime10k();
    });
    finishTime10kInput.addEventListener('keydown', handleEnterBlur);

    finishTimeHalfInput.addEventListener('input', (event) => {
        event.target.value = formatFinishTimeInputValue(event.target.value);
        syncFromFinishTimeHalf();
    });
    finishTimeHalfInput.addEventListener('blur', () => {
        const updated = normalizeFinishTimeOnBlur(finishTimeHalfInput, 2);
        if (finishTimeHalfInput.value && parseFinishTimeToSeconds(finishTimeHalfInput.value) === null) {
            finishTimeHalfInput.value = '';
            clearConverterFields(finishTimeHalfInput);
            return;
        }
        if (updated) syncFromFinishTimeHalf();
    });
    finishTimeHalfInput.addEventListener('keydown', handleEnterBlur);

    finishTimeFullInput.addEventListener('input', (event) => {
        event.target.value = formatFinishTimeInputValue(event.target.value);
        syncFromFinishTimeFull();
    });
    finishTimeFullInput.addEventListener('blur', () => {
        const updated = normalizeFinishTimeOnBlur(finishTimeFullInput, 3);
        if (finishTimeFullInput.value && parseFinishTimeToSeconds(finishTimeFullInput.value) === null) {
            finishTimeFullInput.value = '';
            clearConverterFields(finishTimeFullInput);
            return;
        }
        if (updated) syncFromFinishTimeFull();
    });
    finishTimeFullInput.addEventListener('keydown', handleEnterBlur);
}

let currentPage = 0;
let startX = 0;
let startY = 0;
let currentX = 0;
let isDragging = false;
let axisLocked = null;
let blockSwipe = false;

const EDGE_GUARD = 24;
const LOCK_THRESHOLD = 8;
const SWIPE_THRESHOLD = 0.18;
const SWIPE_BLOCK_SELECTOR = 'input, select, button, a, textarea, label';

function isSwipeBlockedTarget(target) {
    return target instanceof Element && Boolean(target.closest(SWIPE_BLOCK_SELECTOR));
}

function updateDots() {
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentPage);
    });
}

function applyPageStyle() {
    document.body.dataset.page = currentPage;

    pages.forEach((page, index) => {
        if (index === currentPage) {
            page.style.transform = 'rotateY(0deg) scale(1)';
            page.style.opacity = '1';
        } else if (index < currentPage) {
            page.style.transform = 'rotateY(18deg) scale(0.95)';
            page.style.opacity = '0.42';
        } else {
            page.style.transform = 'rotateY(-18deg) scale(0.95)';
            page.style.opacity = '0.42';
        }
    });

    track.style.transform = `translate3d(-${currentPage * window.innerWidth}px, 0, 0)`;
    updateDots();
}

function goTo(index) {
    currentPage = Math.max(0, Math.min(index, pages.length - 1));
    track.style.transition = 'transform 0.42s cubic-bezier(0.22, 1, 0.36, 1)';
    pages.forEach((page) => {
        page.style.transition = 'transform 0.42s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.42s ease';
    });
    applyPageStyle();
}

function onStart(x, y, target) {
    const viewportWidth = window.innerWidth;
    blockSwipe = isSwipeBlockedTarget(target) || x <= EDGE_GUARD || x >= viewportWidth - EDGE_GUARD;
    isDragging = !blockSwipe;
    axisLocked = null;
    startX = x;
    startY = y;
    currentX = x;

    if (blockSwipe) return;

    track.style.transition = 'none';
    pages.forEach((page) => {
        page.style.transition = 'none';
    });
}

function onMove(x, y, event) {
    if (!isDragging || blockSwipe) return;

    currentX = x;
    const diffX = currentX - startX;
    const diffY = y - startY;

    if (!axisLocked) {
        if (Math.abs(diffX) < LOCK_THRESHOLD && Math.abs(diffY) < LOCK_THRESHOLD) {
            return;
        }
        axisLocked = Math.abs(diffX) > Math.abs(diffY) ? 'x' : 'y';
    }

    if (axisLocked === 'y') return;
    if (event && event.cancelable) event.preventDefault();

    const baseX = -currentPage * window.innerWidth;
    let moveX = baseX + diffX;

    if ((currentPage === 0 && diffX > 0) || (currentPage === pages.length - 1 && diffX < 0)) {
        moveX = baseX + (diffX * 0.34);
    }

    track.style.transform = `translate3d(${moveX}px, 0, 0)`;

    const rotateAmount = Math.max(-24, Math.min(24, diffX / 8));
    pages.forEach((page, index) => {
        if (index === currentPage) {
            page.style.transform = `rotateY(${rotateAmount * 0.28}deg) scale(0.985)`;
            page.style.opacity = '1';
        } else if (index === currentPage - 1) {
            page.style.transform = `rotateY(${18 + rotateAmount * 0.16}deg) scale(0.95)`;
            page.style.opacity = '0.45';
        } else if (index === currentPage + 1) {
            page.style.transform = `rotateY(${-18 + rotateAmount * 0.16}deg) scale(0.95)`;
            page.style.opacity = '0.45';
        }
    });
}

function onEnd() {
    if (!isDragging) return;
    isDragging = false;

    if (blockSwipe || axisLocked !== 'x') {
        goTo(currentPage);
        return;
    }

    const diff = currentX - startX;
    const threshold = window.innerWidth * SWIPE_THRESHOLD;

    if (diff < -threshold && currentPage < pages.length - 1) {
        currentPage += 1;
    } else if (diff > threshold && currentPage > 0) {
        currentPage -= 1;
    }

    goTo(currentPage);
}

function attachSwipeHandlers() {
    appStage.addEventListener('touchstart', (event) => {
        const touch = event.touches[0];
        onStart(touch.clientX, touch.clientY, event.target);
    }, { passive: true });

    appStage.addEventListener('touchmove', (event) => {
        const touch = event.touches[0];
        onMove(touch.clientX, touch.clientY, event);
    }, { passive: false });

    appStage.addEventListener('touchend', onEnd, { passive: true });
    appStage.addEventListener('touchcancel', onEnd, { passive: true });

    appStage.addEventListener('mousedown', (event) => {
        onStart(event.clientX, event.clientY, event.target);
    });

    window.addEventListener('mousemove', (event) => {
        onMove(event.clientX, event.clientY, event);
    });

    window.addEventListener('mouseup', onEnd);
    window.addEventListener('resize', () => goTo(currentPage));

    dots.forEach((dot) => {
        dot.addEventListener('click', () => {
            goTo(Number(dot.dataset.index));
        });
    });
}

attachConverterHandlers();
attachWorkoutInputHandlers();
updateWorkoutRowVisibility();
attachSwipeHandlers();
applyPageStyle();
