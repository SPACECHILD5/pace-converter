const paceInput = document.getElementById("pace-km");
const speedInput = document.getElementById("speed-kmh");
const finishTime10kInput = document.getElementById("finishtime-10k");
const finishTimeHalfInput = document.getElementById("finishtime-half");
const finishTimeFullInput = document.getElementById("finishtime-full");

const carouselEl = document.getElementById("carousel");
const carouselTrack = document.getElementById("carousel-track");
const pages = document.querySelectorAll(".page");
const dots = document.querySelectorAll(".dot");

const addWorkoutRowButton = document.getElementById("add-workout-row");
const workoutRows = Array.from(document.querySelectorAll(".workout-row"));
const workoutBox = document.querySelector(".workout-box");
const avgPaceEl = document.getElementById("avg-pace");
const avgSpeedEl = document.getElementById("avg-speed");

const DISTANCE_10K = 10.0;
const DISTANCE_HALF = 21.0975;
const DISTANCE_FULL = 42.195;
const MAX_SPEED_KMH = 30;
const MAX_PACE_SECONDS = 20 * 60;
const DEFAULT_VISIBLE_WORKOUT_ROWS = 3;

const finishTimeFields = [
  { input: finishTime10kInput, distanceKm: DISTANCE_10K, minDigits: 2 },
  { input: finishTimeHalfInput, distanceKm: DISTANCE_HALF, minDigits: 2 },
  { input: finishTimeFullInput, distanceKm: DISTANCE_FULL, minDigits: 3 },
];

const workoutSteps = workoutRows.map((row) => {
  const id = Number(row.dataset.rowId);
  return {
    id,
    row,
    input: row.querySelector(".workout-pace-input"),
    output: row.querySelector(`[data-speed-for="${id}"]`),
    secPerKm: null,
  };
});

let visibleWorkoutRows = Math.min(
  DEFAULT_VISIBLE_WORKOUT_ROWS,
  workoutSteps.length,
);

const EDGE_GUARD = 24;
const LOCK_THRESHOLD = 8;
const SWIPE_THRESHOLD = 0.18;
const SWIPE_BLOCK_SELECTOR = "input, select, button, a, textarea, label";

function initCarousel() {
  if (!carouselEl || !carouselTrack || pages.length === 0) return;

  let currentPage = 0;
  let startX = 0;
  let startY = 0;
  let currentX = 0;
  let isDragging = false;
  let axisLocked = null;
  let blockSwipe = false;

  function isSwipeBlockedTarget(target) {
    return (
      target instanceof Element && Boolean(target.closest(SWIPE_BLOCK_SELECTOR))
    );
  }

  function updateDots() {
    dots.forEach((dot, index) => {
      const isActive = index === currentPage;
      dot.classList.toggle("active", isActive);
      if (isActive) {
        dot.setAttribute("aria-current", "page");
      } else {
        dot.removeAttribute("aria-current");
      }
    });
  }

  function applyPageStyle() {
    document.body.dataset.page = currentPage;

    pages.forEach((page, index) => {
      if (index === currentPage) {
        page.style.transform = "rotateY(0deg) scale(1)";
        page.style.opacity = "1";
        page.setAttribute("aria-hidden", "false");
      } else if (index < currentPage) {
        page.style.transform = "rotateY(18deg) scale(0.95)";
        page.style.opacity = "0.42";
        page.setAttribute("aria-hidden", "true");
      } else {
        page.style.transform = "rotateY(-18deg) scale(0.95)";
        page.style.opacity = "0.42";
        page.setAttribute("aria-hidden", "true");
      }
    });

    carouselTrack.style.transform = `translate3d(-${currentPage * window.innerWidth}px, 0, 0)`;
    updateDots();
  }

  function goToPage(index) {
    currentPage = Math.max(0, Math.min(index, pages.length - 1));
    carouselTrack.style.transition =
      "transform 0.42s cubic-bezier(0.22, 1, 0.36, 1)";
    pages.forEach((page) => {
      page.style.transition =
        "transform 0.42s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.42s ease";
    });
    applyPageStyle();
  }

  function onStart(x, y, target) {
    const viewportWidth = window.innerWidth;
    blockSwipe =
      isSwipeBlockedTarget(target) ||
      x <= EDGE_GUARD ||
      x >= viewportWidth - EDGE_GUARD;
    isDragging = !blockSwipe;
    axisLocked = null;
    startX = x;
    startY = y;
    currentX = x;

    if (blockSwipe) return;

    carouselTrack.style.transition = "none";
    pages.forEach((page) => {
      page.style.transition = "none";
    });
  }

  function onMove(x, y, event) {
    if (!isDragging || blockSwipe) return;

    currentX = x;
    const diffX = currentX - startX;
    const diffY = y - startY;

    if (!axisLocked) {
      if (
        Math.abs(diffX) < LOCK_THRESHOLD &&
        Math.abs(diffY) < LOCK_THRESHOLD
      ) {
        return;
      }
      axisLocked = Math.abs(diffX) > Math.abs(diffY) ? "x" : "y";
    }

    if (axisLocked === "y") return;
    if (event && event.cancelable) event.preventDefault();

    const baseX = -currentPage * window.innerWidth;
    let moveX = baseX + diffX;

    if (
      (currentPage === 0 && diffX > 0) ||
      (currentPage === pages.length - 1 && diffX < 0)
    ) {
      moveX = baseX + diffX * 0.34;
    }

    carouselTrack.style.transform = `translate3d(${moveX}px, 0, 0)`;

    const rotateAmount = Math.max(-24, Math.min(24, diffX / 8));
    pages.forEach((page, index) => {
      if (index === currentPage) {
        page.style.transform = `rotateY(${rotateAmount * 0.28}deg) scale(0.985)`;
        page.style.opacity = "1";
      } else if (index === currentPage - 1) {
        page.style.transform = `rotateY(${18 + rotateAmount * 0.16}deg) scale(0.95)`;
        page.style.opacity = "0.45";
      } else if (index === currentPage + 1) {
        page.style.transform = `rotateY(${-18 + rotateAmount * 0.16}deg) scale(0.95)`;
        page.style.opacity = "0.45";
      }
    });
  }

  function onEnd() {
    if (!isDragging) return;
    isDragging = false;

    if (blockSwipe || axisLocked !== "x") {
      goToPage(currentPage);
      return;
    }

    const diff = currentX - startX;
    const threshold = window.innerWidth * SWIPE_THRESHOLD;

    if (diff < -threshold && currentPage < pages.length - 1) {
      currentPage += 1;
    } else if (diff > threshold && currentPage > 0) {
      currentPage -= 1;
    }

    goToPage(currentPage);
  }

  carouselEl.addEventListener(
    "touchstart",
    (event) => {
      const touch = event.touches[0];
      onStart(touch.clientX, touch.clientY, event.target);
    },
    { passive: true },
  );

  carouselEl.addEventListener(
    "touchmove",
    (event) => {
      const touch = event.touches[0];
      onMove(touch.clientX, touch.clientY, event);
    },
    { passive: false },
  );

  carouselEl.addEventListener("touchend", onEnd, { passive: true });
  carouselEl.addEventListener("touchcancel", onEnd, { passive: true });

  carouselEl.addEventListener("mousedown", (event) => {
    onStart(event.clientX, event.clientY, event.target);
  });

  window.addEventListener("mousemove", (event) => {
    onMove(event.clientX, event.clientY, event);
  });

  window.addEventListener("mouseup", onEnd);
  window.addEventListener("resize", () => goToPage(currentPage));

  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      goToPage(Number(dot.dataset.index));
    });
  });

  applyPageStyle();
}

function getPaceParts(paceStr) {
  const parts = paceStr.split(":");
  if (parts.length !== 2) return null;

  const min = parseInt(parts[0], 10);
  const sec = parseInt(parts[1], 10);

  if (isNaN(min) || isNaN(sec) || min < 0 || sec < 0) return null;
  return { min, sec };
}

function parsePaceToSeconds(paceStr) {
  const paceParts = getPaceParts(paceStr);
  if (!paceParts || paceParts.sec >= 60) return null;

  const totalSeconds = paceParts.min * 60 + paceParts.sec;
  if (totalSeconds > MAX_PACE_SECONDS) return null;

  return totalSeconds;
}

function secondsPerKmToSpeed(secPerKm) {
  if (!secPerKm || secPerKm <= 0) return null;
  return 3600 / secPerKm;
}

function speedToSecondsPerKm(speedKmh) {
  if (!(speedKmh > 0 && speedKmh <= MAX_SPEED_KMH)) return null;
  return 3600 / speedKmh;
}

function finishTimeToSecondsPerKm(totalSeconds, distanceKm) {
  if (!totalSeconds || totalSeconds <= 0 || !distanceKm) return null;
  return totalSeconds / distanceKm;
}

function secondsPerKmToFinishTime(secPerKm, distanceKm) {
  if (!secPerKm || secPerKm <= 0 || !distanceKm) return null;
  return secPerKm * distanceKm;
}

function formatSecondsToPace(seconds) {
  if (!seconds || seconds <= 0) return "";
  const roundedSeconds = Math.round(seconds);
  const mins = Math.floor(roundedSeconds / 60);
  const secs = roundedSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function parseFinishTimeToSeconds(timeStr) {
  const parts = timeStr.split(":").map((part) => parseInt(part, 10));
  if (parts.some(isNaN)) return null;

  if (parts.length === 3) {
    const [hours, mins, secs] = parts;
    if (hours < 0 || mins < 0 || secs < 0 || mins >= 60 || secs >= 60) {
      return null;
    }
    return hours * 3600 + mins * 60 + secs;
  }

  if (parts.length === 2) {
    const [mins, secs] = parts;
    if (secs < 0 || secs >= 60 || mins < 10) return null;
    return mins * 60 + secs;
  }

  return null;
}

function formatSecondsToFinishTime(seconds) {
  if (!seconds || seconds <= 0) return "";

  const roundedSeconds = Math.round(seconds);
  const hrs = Math.floor(roundedSeconds / 3600);
  const mins = Math.floor((roundedSeconds % 3600) / 60);
  const secs = roundedSeconds % 60;

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

function formatSpeed(speedKmh) {
  if (!speedKmh || speedKmh <= 0) return "";
  return speedKmh.toFixed(1);
}

function formatPaceInputValue(value) {
  let formatted = value.replace(/[^\d:]/g, "");
  const digits = formatted.replace(/:/g, "");

  const cappedDigits = digits.length > 4 ? digits.substring(0, 4) : digits;

  if (cappedDigits.length >= 3) {
    formatted = `${cappedDigits.substring(0, cappedDigits.length - 2)}:${cappedDigits.substring(cappedDigits.length - 2)}`;
  } else {
    formatted = cappedDigits;
  }

  const paceParts = getPaceParts(formatted);
  if (paceParts) {
    const totalSeconds = paceParts.min * 60 + paceParts.sec;
    if (paceParts.sec >= 60 || totalSeconds > MAX_PACE_SECONDS) {
      return formatSecondsToPace(MAX_PACE_SECONDS);
    }
  }

  return formatted;
}

function formatSpeedInputValue(value) {
  let formatted = value.replace(/[^\d.]/g, "");
  const dotIndex = formatted.indexOf(".");

  if (dotIndex === -1) {
    if (formatted.length >= 3) {
      formatted = `${formatted.substring(0, formatted.length - 1)}.${formatted.substring(formatted.length - 1)}`;
    }
  } else {
    const intPart = formatted.substring(0, dotIndex);
    const decPart = formatted
      .substring(dotIndex + 1)
      .replace(/\./g, "")
      .substring(0, 1);
    formatted = `${intPart}.${decPart}`;
  }

  const speed = parseFloat(formatted);
  if (!isNaN(speed) && speed > MAX_SPEED_KMH) {
    return formatSpeed(MAX_SPEED_KMH);
  }

  return formatted;
}

function formatFinishTimeInputValue(value) {
  let formatted = value.replace(/[^\d:]/g, "");
  const digits = formatted.replace(/:/g, "");

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
  const digits = value.replace(/:/g, "");
  let nextValue = value;

  if (colons === 0 && digits.length === 2 && minDigits <= 2) {
    nextValue = `${digits}:00`;
  } else if (colons === 1) {
    const firstPart = parseInt(value.split(":")[0], 10);
    if (!isNaN(firstPart) && firstPart < 10) {
      nextValue = `${value}:00`;
    }
  }

  if (nextValue !== value) {
    input.value = nextValue;
    return true;
  }

  return false;
}

function getWorkoutStep(rowId) {
  return workoutSteps.find((step) => step.id === rowId);
}

function getWorkoutRowId(input) {
  const row = input.closest(".workout-row");
  return row ? Number(row.dataset.rowId) : null;
}

function resetWorkoutStep(step) {
  step.secPerKm = null;
  if (step.input) step.input.value = "";
  updateWorkoutRowSpeed(step.id);
}

function clearConverterFields(exceptInput) {
  if (exceptInput !== paceInput) paceInput.value = "";
  if (exceptInput !== speedInput) speedInput.value = "";
  finishTimeFields.forEach(({ input }) => {
    if (exceptInput !== input) input.value = "";
  });
}

function renderConverterFromSecondsPerKm(secPerKm, sourceInput) {
  if (!secPerKm) {
    clearConverterFields(sourceInput);
    return;
  }

  if (sourceInput !== paceInput) {
    paceInput.value = formatSecondsToPace(secPerKm);
  }

  if (sourceInput !== speedInput) {
    speedInput.value = formatSpeed(secondsPerKmToSpeed(secPerKm));
  }

  finishTimeFields.forEach(({ input, distanceKm }) => {
    if (sourceInput === input) return;
    input.value = formatSecondsToFinishTime(
      secondsPerKmToFinishTime(secPerKm, distanceKm),
    );
  });
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

  renderConverterFromSecondsPerKm(secPerKm, paceInput);
}

function syncFromSpeed() {
  const speedStr = speedInput.value.trim();
  if (!speedStr) {
    clearConverterFields(speedInput);
    return;
  }

  const speed = parseFloat(speedStr);
  const secPerKm = speedToSecondsPerKm(speed);
  if (!secPerKm) {
    clearConverterFields(speedInput);
    return;
  }

  renderConverterFromSecondsPerKm(secPerKm, speedInput);
}

function syncFromFinishTime(input, distanceKm) {
  const totalSeconds = parseFinishTimeToSeconds(input.value.trim());
  if (!totalSeconds) {
    clearConverterFields(input);
    return;
  }

  const secPerKm = finishTimeToSecondsPerKm(totalSeconds, distanceKm);
  renderConverterFromSecondsPerKm(secPerKm, input);
}

function handleConverterFocus(event) {
  event.target.value = "";
  clearConverterFields(null);
}

function handlePaceBlur(event) {
  const value = event.target.value.trim();
  if (!value) return;
  if (parsePaceToSeconds(value) === null) {
    event.target.value = "";
    clearConverterFields(paceInput);
  }
}

function handleSpeedBlur(event) {
  const value = event.target.value.trim();
  if (!value) return;

  const speed = parseFloat(value);
  if (!isNaN(speed) && speed > 0) {
    event.target.value = formatSpeed(speed);
  } else {
    event.target.value = "";
    clearConverterFields(speedInput);
  }
}

function handleEnterBlur(event) {
  if (event.key === "Enter") {
    event.target.blur();
  }
}

function updateWorkoutRowVisibility() {
  if (!addWorkoutRowButton) return;
  workoutSteps.forEach((step, index) => {
    const isHidden = index + 1 > visibleWorkoutRows;
    step.row.classList.toggle("is-hidden", isHidden);
    step.row.setAttribute("aria-hidden", String(isHidden));
  });
  addWorkoutRowButton.classList.toggle(
    "is-hidden",
    visibleWorkoutRows >= workoutSteps.length,
  );
  if (workoutBox) {
    workoutBox.classList.toggle(
      "is-compact",
      visibleWorkoutRows >= workoutSteps.length,
    );
    workoutBox.dataset.rowCount = String(visibleWorkoutRows);
  }
}

function updateWorkoutRowSpeed(rowId) {
  const step = getWorkoutStep(rowId);
  if (!step || !step.output) return;

  const speed = secondsPerKmToSpeed(step.secPerKm);
  step.output.textContent = speed ? formatSpeed(speed) : "--";
  updateWorkoutSummary();
}

function updateWorkoutSummary() {
  if (!avgPaceEl || !avgSpeedEl) return;

  const filledRows = workoutSteps
    .slice(0, visibleWorkoutRows)
    .filter((step) => step.secPerKm);

  if (filledRows.length === 0) {
    avgPaceEl.textContent = "--:-- /km";
    avgSpeedEl.textContent = "--.- km/h";
    return;
  }

  const totalSeconds = filledRows.reduce(
    (sum, step) => sum + step.secPerKm,
    0,
  );
  const avgSecPerKm = totalSeconds / filledRows.length;
  const avgSpeed = secondsPerKmToSpeed(avgSecPerKm);

  avgPaceEl.textContent = `${formatSecondsToPace(avgSecPerKm)} /km`;
  avgSpeedEl.textContent = `${formatSpeed(avgSpeed)} km/h`;
}

function attachWorkoutInputHandlers() {
  if (workoutSteps.length === 0) return;

  let isNavigatingWithEnter = false;

  workoutSteps.forEach((step) => {
    const { input } = step;
    if (!input) return;

    input.addEventListener("focus", (event) => {
      if (isNavigatingWithEnter) {
        isNavigatingWithEnter = false;
        return;
      }

      event.target.value = "";
      resetWorkoutStep(step);
    });

    input.addEventListener("input", (event) => {
      const formattedPace = formatPaceInputValue(event.target.value);
      event.target.value = formattedPace;

      step.secPerKm = parsePaceToSeconds(formattedPace);
      updateWorkoutRowSpeed(step.id);
    });

    input.addEventListener("blur", (event) => {
      if (
        event.target.value &&
        parsePaceToSeconds(event.target.value) === null
      ) {
        resetWorkoutStep(step);
      }
    });

    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        const currentRowId = getWorkoutRowId(event.target);

        if (
          event.target.value &&
          parsePaceToSeconds(event.target.value) === null
        ) {
          resetWorkoutStep(step);
          return;
        }

        if (currentRowId && currentRowId < workoutSteps.length) {
          const nextRowId = currentRowId + 1;

          if (nextRowId <= visibleWorkoutRows) {
            const nextStep = getWorkoutStep(nextRowId);
            if (nextStep && nextStep.input) {
              isNavigatingWithEnter = true;
              nextStep.input.focus();
            }
          } else {
            event.target.blur();
          }
        } else {
          event.target.blur();
        }
      }
    });
  });

  if (!addWorkoutRowButton) return;

  addWorkoutRowButton.addEventListener("click", () => {
    if (visibleWorkoutRows >= workoutSteps.length) return;
    visibleWorkoutRows += 1;
    updateWorkoutRowVisibility();
  });
}

function attachConverterHandlers() {
  const converterInputs = [
    paceInput,
    speedInput,
    ...finishTimeFields.map(({ input }) => input),
  ];
  converterInputs.forEach((input) =>
    input.addEventListener("focus", handleConverterFocus),
  );

  paceInput.addEventListener("input", (event) => {
    event.target.value = formatPaceInputValue(event.target.value);
    syncFromPace();
  });
  paceInput.addEventListener("blur", handlePaceBlur);
  paceInput.addEventListener("keydown", handleEnterBlur);

  speedInput.addEventListener("input", (event) => {
    event.target.value = formatSpeedInputValue(event.target.value);
    syncFromSpeed();
  });
  speedInput.addEventListener("blur", handleSpeedBlur);
  speedInput.addEventListener("keydown", handleEnterBlur);

  finishTimeFields.forEach(({ input, distanceKm, minDigits }) => {
    input.addEventListener("input", (event) => {
      event.target.value = formatFinishTimeInputValue(event.target.value);
      syncFromFinishTime(input, distanceKm);
    });

    input.addEventListener("blur", () => {
      const updated = normalizeFinishTimeOnBlur(input, minDigits);
      if (input.value && parseFinishTimeToSeconds(input.value) === null) {
        input.value = "";
        clearConverterFields(input);
        return;
      }
      if (updated) syncFromFinishTime(input, distanceKm);
    });

    input.addEventListener("keydown", handleEnterBlur);
  });
}

initCarousel();
attachConverterHandlers();
attachWorkoutInputHandlers();
updateWorkoutRowVisibility();
