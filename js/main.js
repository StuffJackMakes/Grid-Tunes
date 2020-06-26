// Keep track of all grids
let currentGridTuneObjects = [];

// Changes the volume of all grids
function OnVolumeSliderChange(slider) {
    for (let gridTune of currentGridTuneObjects) {
        gridTune.SetVolume(slider.value);
    }
    slider.labels[0].textContent = slider.value + " dB";
}

// Changes the speed of all grids
function OnSpeedSliderChange(slider) {
    for (let gridTune of currentGridTuneObjects) {
        gridTune.SetSpeed(slider.value);
    }
    slider.labels[0].textContent = slider.value;
}

// Pauses or continues playing of all grids
function PlayPause() {
    if (document.getElementById("playPauseButton").classList.contains("fa-pause")) {
        for (let gridTune of currentGridTuneObjects) {
            gridTune.SetPaused(true);
        }
        document.getElementById("playPauseButton").classList.remove("fa-pause");
        document.getElementById("playPauseButton").classList.add("fa-play");
    } else {
        for (let gridTune of currentGridTuneObjects) {
            gridTune.SetPaused(false);
        }
        document.getElementById("playPauseButton").classList.remove("fa-play");
        document.getElementById("playPauseButton").classList.add("fa-pause");
    }
}

// Progresses all grids by a single step
function SingleStep() {
    for (let gridTune of currentGridTuneObjects) {
        gridTune.ForceStep();
    }
}

// Progresses all grids backwards by a single step
function SingleStepBack() {
    for (let gridTune of currentGridTuneObjects) {
        gridTune.ForceStepBack();
    }
}

// Clears all grids
function ClearGrid() {
    for (let gridTune of currentGridTuneObjects) {
        gridTune.ClearGrid();
    }
}

// Adds a new grid
function AddGridTune() {
    let newGridTune = new GridTune(document.getElementById("gridTuneContainer"),
        ["B3", "C#4", "F#4", "G#4", "C#5", "D#5", "D#5", "C#5", "G#4", "F#4", "C#4", "B3"]);

    // Randomize any grids created after the first
    if (currentGridTuneObjects.length > 0) {
        newGridTune.RandomizeOscillatorType();
    }

    currentGridTuneObjects.push(newGridTune);
}

// Removes the most recently-added grid
function RemoveGridTune() {
    if (currentGridTuneObjects.length > 1) {
        currentGridTuneObjects.pop().DestroyHtml();
    }
}

// Set up the initial grid and step control
window.onload = () => {
    AddGridTune();

    // Update the GridTune on every frame
    function step() {
        for (let gridTune of currentGridTuneObjects) {
            gridTune.Step();
        }
        window.requestAnimationFrame(step);
    }
    window.requestAnimationFrame(step);
}