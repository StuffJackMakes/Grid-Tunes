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
    if (!currentGridTuneObjects[0].isPaused) {
        for (let gridTune of currentGridTuneObjects) {
            gridTune.SetPaused(true);
        }
        document.getElementById("playPauseButton").setAttribute("d", "M3 22v-20l18 10-18 10z");
    } else {
        for (let gridTune of currentGridTuneObjects) {
            gridTune.SetPaused(false);
        }
        document.getElementById("playPauseButton").setAttribute("d", "M11 22h-4v-20h4v20zm6-20h-4v20h4v-20z");
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

    // Set the volume, speed, and pause state
    newGridTune.SetVolume(document.getElementById("volumeSlider").value);
    newGridTune.SetSpeed(document.getElementById("speedSlider").value);
    if (currentGridTuneObjects.length > 0) newGridTune.SetPaused(currentGridTuneObjects[0].isPaused);

    currentGridTuneObjects.push(newGridTune);
}

// Removes the most recently-added grid
function RemoveGridTune() {
    if (currentGridTuneObjects.length > 1) {
        currentGridTuneObjects.pop().DestroyHtml();
    }
}

// Get a shareable link to the current configuration
function GetLink() {
    // Serialize global parameters
    let serializedData = [];
    serializedData.push(Number(document.getElementById("volumeSlider").value));
    serializedData.push(Number(document.getElementById("speedSlider").value));

    // Serialize each grid
    serializedData.push([]);
    for (let gridTune of currentGridTuneObjects) {
        serializedData[2].push(gridTune.Serialize());
    }

    // Convert the serialized object to a base64 string so it can be put in a URL
    let serializedString = btoa(JSON.stringify(serializedData));
    let shareableLink = window.location + "?" + serializedString;

    // Copy and display the shareable link
    navigator.clipboard.writeText(shareableLink);
    document.getElementById("shareLink").textContent = shareableLink;
    document.getElementById("shareLink").style.display = "block";
}

// Load a shareable link
function SetupFromSerializedString(serializedString) {
    // Get the object from the string
    let serializedData = JSON.parse(atob(serializedString));

    // Set global properties according to the deserialized data
    document.getElementById("volumeSlider").value = serializedData[0];
    document.getElementById("volumeSlider").onchange();
    document.getElementById("speedSlider").value = serializedData[1];
    document.getElementById("speedSlider").onchange();

    // Set each grid's parameters and blips according to the deserialized data
    for (let grid of serializedData[2]) {
        AddGridTune();
        currentGridTuneObjects[currentGridTuneObjects.length - 1].Deserialize(grid);
    }
}

// Set up the initial grid and step control
window.onload = () => {
    // Load the setup for a shareable link if one was used
    if (window.location.search && window.location.search.indexOf("?") === 0) {
        PlayPause();
        try {
            SetupFromSerializedString(window.location.search.substring(1));
        } catch (err) {
            console.error("Error loading serialized grids:", err);
            PlayPause();
            AddGridTune();
        }
    } else {
        // If this is not a shareable link, load the default grid instead
        AddGridTune();
    }

    // Update the GridTune on every frame
    function step() {
        for (let gridTune of currentGridTuneObjects) {
            gridTune.Step();
        }
        window.requestAnimationFrame(step);
    }
    window.requestAnimationFrame(step);
}