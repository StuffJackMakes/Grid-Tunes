const BLIP_STATE = {
    UP: 1,
    RIGHT: 2,
    DOWN: 3,
    LEFT: 4
}

const OSCILLATOR_TYPES = ["triangle", "fmtriangle", "amtriangle", "fattriangle", "sine", "fmsine", "amsine", "fatsine", "square", "fmsquare", "amsquare", "fatsquare", "sawtooth", "fmsawtooth", "amsawtooth", "fatsawtooth", "pwm", "pulse"];

const CANVAS_SIZE = 360;

class GridTune {
    constructor(parentElement, notes) {
        this.CreateHtml(parentElement);

        // Store arguments
        this.notes = notes;

        // Keep track of steps and if this is paused
        this.stepCount = 0;
        this.stepsBetweenMovement = 10;
        this.isPaused = false;

        // Calculate the grid parameters
        this.gridWidth = this.notes.length;
        this.gridHeight = this.notes.length;
        this.cellWidth = this.canvas.width / this.gridWidth;
        this.cellHeight = this.canvas.height / this.gridHeight;
        this.ClearGrid();

        // Create the synthesizer
        this.synth = new Tone.PolySynth(4, Tone.Synth, {
            oscillator : {
                type : "triangle"
            }
        }).toMaster();

        // Allow placement, rotation, or removal of blips when clicking
        this.canvas.addEventListener("click", (event) => {
            let cell = this.GetCellPositionAtMouse(event);

            // If there are no blips in the clicked cell, create one
            // Otherwise, rotate all blips in the clicked cell
            // Remove any blips that rotate past lett
            if (this.gridState[cell.x][cell.y].length === 0) {
                this.gridState[cell.x][cell.y].push(BLIP_STATE.UP);
            } else {
                this.RotateBlipsInCell(cell.x, cell.y, true);
            }
        });


    }

    // Creates the canvas and some control elements that affect this grid directly
    CreateHtml(parentElement) {
        this.container = document.createElement("div");
        this.container.style.cssText = "display: flex; flex-direction: column; align-items: center; margin: 5px; max-width: " + CANVAS_SIZE + "px;"

        // Create the detune value selector
        let detuneContainer = document.createElement("div");
        detuneContainer.style.margin = "4px";

        let detuneLabel = document.createElement("label");
        detuneLabel.textContent = "Detune";

        let detuneValueLabel = document.createElement("label");
        detuneValueLabel.textContent = "0 cents";

        this.detuneSlider = document.createElement("input");
        this.detuneSlider.type = "range";
        this.detuneSlider.min = -5000;
        this.detuneSlider.max = 5000;
        this.detuneSlider.step = 100;
        this.detuneSlider.onchange = () => {
            this.SetDetune(this.detuneSlider.value, true);
            detuneValueLabel.textContent = this.detuneSlider.value + " cents";
        }

        detuneContainer.appendChild(detuneLabel);
        detuneContainer.appendChild(this.detuneSlider);
        detuneContainer.appendChild(detuneValueLabel);
        this.container.append(detuneContainer);

        // Create the oscillation type selector
        this.oscillatorSelect = document.createElement("select");
        this.oscillatorSelect.style.margin = "4px";
        for (let type of OSCILLATOR_TYPES) {
            let option = document.createElement("option");
            option.value = type;
            option.text = type;
            this.oscillatorSelect.add(option, null);
        }
        this.oscillatorSelect.onchange = () => { this.SetOscillatorType(this.oscillatorSelect.value, true); }
        this.container.appendChild(this.oscillatorSelect);

        this.canvas = document.createElement("canvas");
        this.canvas.width = CANVAS_SIZE;
        this.canvas.height = CANVAS_SIZE;
        this.container.append(this.canvas);

        parentElement.appendChild(this.container);
    }

    // Removes all HTML elements created by this grid
    DestroyHtml() {
        this.container.remove();
    }

    // Sets the volume this synthesizer plays at
    SetVolume(value) {
        this.synth.output.volume.value = value;
    }

    // Sets the detune of this synthesizer
    SetDetune(value, dontUpdateUI) {
        this.synth.detune.value = value;
        this.detuneSlider.value = value;
        if (!dontUpdateUI) {
            this.detuneSlider.onchange();
        }
    }

    // Sets the oscaillator type of the synthesizer
    SetOscillatorType(oscillatorType, dontUpdateUI) {
        let volume = this.synth.output.volume.value;
        let detune = this.synth.detune.value;

        this.synth = new Tone.PolySynth(4, Tone.Synth, {
            oscillator : {
                type : oscillatorType
            }
        }).toMaster();

        if (!dontUpdateUI) {
            this.oscillatorSelect.value = oscillatorType;
        }

        this.SetVolume(volume);
        this.SetDetune(detune);
    }

    // Sets how quickly blips step along this grid
    SetSpeed(delay) { this.stepsBetweenMovement = delay; }

    // Sets if this grid should update itself or not
    SetPaused(paused) { this.isPaused = paused; }

    // Randomizes the oscillator type of this grid
    RandomizeOscillatorType() {
        this.SetOscillatorType(OSCILLATOR_TYPES[Math.floor(Math.random() * OSCILLATOR_TYPES.length)]);
    }

    // Clear the grid of any blips
    ClearGrid() {
        // The main grid state
        this.gridState = [];
        for (let i = 0; i < this.gridWidth; i++) {
            this.gridState.push(new Array(this.gridHeight));
            for (let j = 0; j < this.gridHeight; j++) {
                this.gridState[i][j] = [];
            }
        }

        // Store an empty grid state to swap with the main grid state whenever the grid is updated
        this.emptyGrid = [];
        for (let i = 0; i < this.gridWidth; i++) {
            this.emptyGrid.push(new Array(this.gridHeight));
            for (let j = 0; j < this.gridHeight; j++) {
                this.emptyGrid[i][j] = [];
            }
        }
    }

    // Updates the time step of this grid and progresses all blips if necesarry
    // Redraws the canvas
    Step() {
        if (this.stepCount >= this.stepsBetweenMovement) {
            this.UpdateGrid();
            this.stepCount = 0;
        } else {
            if (!this.isPaused) this.stepCount += 1;
        }
        this.DrawGrid(this.canvas.getContext("2d"));
    }

    // Forces a step of this grid, even if it is paused
    ForceStep() {
        this.stepCount = this.stepsBetweenMovement;
    }

    // Forces a reverse step of this grid, even if it is paused
    ForceStepBack() {
        this.stepCount = 0;
        this.UpdateGrid(true);
    }

    // Moves all blips one step in whiever direction they're headed
    // Plays notes when blips hit the edge of the grid
    // Handles collision of blips
    UpdateGrid(reverse) {
        let notesToPlay = [];
        let newGridState = this.emptyGrid;

        // Step through each cell of the grid
        for (let i = 0; i < this.gridWidth; i++) {
            for (let j = 0; j < this.gridHeight; j++) {
                // Step through each blip in a given cell
                let blip = this.gridState[i][j].pop()

                // While there is a clip to handle, do so and add it to the new grid
                while (blip) {
                    if ((!reverse && blip === BLIP_STATE.UP) || (reverse && blip === BLIP_STATE.DOWN)) {
                        // Handle UP blips and reverse DOWN blips
                        if (reverse && j == 1) {
                            newGridState[i][j-1].push(this.FlipBlip(blip));
                            if (notesToPlay.indexOf(this.notes[i]) === -1) notesToPlay.push(this.notes[i]);
                        } else if (j > 0) {
                            newGridState[i][j-1].push(blip);
                        } else {
                            newGridState[i][j+1].push(this.FlipBlip(blip));
                            if (notesToPlay.indexOf(this.notes[i]) === -1) notesToPlay.push(this.notes[i]);
                        }
                    } else if ((!reverse && blip === BLIP_STATE.RIGHT) || (reverse && blip === BLIP_STATE.LEFT)) {
                        // Handle RIGHT blips and reverse LEFT blips
                        if (reverse && i === this.gridWidth - 2) {
                            newGridState[i+1][j].push(this.FlipBlip(blip));
                            if (notesToPlay.indexOf(this.notes[j]) === -1) notesToPlay.push(this.notes[j]);
                        } else if (i < this.gridWidth - 1) {
                            newGridState[i+1][j].push(blip);
                        } else {
                            newGridState[i-1][j].push(this.FlipBlip(blip));
                            if (notesToPlay.indexOf(this.notes[j]) === -1) notesToPlay.push(this.notes[j]);
                        }
                    } else if ((!reverse && blip === BLIP_STATE.DOWN) || (reverse && blip === BLIP_STATE.UP)) {
                        // Handle DOWN blips and reverse UP blips
                        if (reverse && j === this.gridHeight - 2) {
                            newGridState[i][j+1].push(this.FlipBlip(blip));
                            if (notesToPlay.indexOf(this.notes[i]) === -1) notesToPlay.push(this.notes[i]);
                        } else if (j < this.gridHeight - 1) {
                            newGridState[i][j+1].push(blip);
                        } else {
                            newGridState[i][j-1].push(this.FlipBlip(blip));
                            if (notesToPlay.indexOf(this.notes[i]) === -1) notesToPlay.push(this.notes[i]);
                        }
                    } else if ((!reverse && blip === BLIP_STATE.LEFT) || (reverse && blip === BLIP_STATE.RIGHT)) {
                        // Handle LEFT blips and reverse RIGHT blips
                        if (reverse && i == 1) {
                            newGridState[i-1][j].push(this.FlipBlip(blip));
                            if (notesToPlay.indexOf(this.notes[j]) === -1) notesToPlay.push(this.notes[j]);
                        } else if (i > 0) {
                            newGridState[i-1][j].push(blip);
                        } else {
                            newGridState[i+1][j].push(this.FlipBlip(blip));
                            if (notesToPlay.indexOf(this.notes[j]) === -1) notesToPlay.push(this.notes[j]);
                        }
                    }

                    // Check for the next blip in this cell
                    blip = this.gridState[i][j].pop();
                }
            }
        }

        // The original grid state is now empty, so replace it with the new grid state
        this.emptyGrid = this.gridState;
        this.gridState = newGridState;

        // If multiple blips ended up in the same cell, rotate all of them clockwise
        for (let i = 0; i < this.gridWidth; i++) {
            for (let j = 0; j < this.gridHeight; j++) {
                if (this.gridState[i][j].length > 1) {
                    this.RotateBlipsInCell(i, j);
                }
            }
        }

        // Play any notes that need to be played
        this.synth.triggerAttackRelease(notesToPlay, "16n");
    }

    // Draws the grid and all blips
    DrawGrid(ctx) {
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        ctx.strokeStyle = "#000";
        for (let i = 0; i < this.gridWidth; i++) {
            for (let j = 0; j < this.gridHeight; j++) {
                let blipCount = this.gridState[i][j].length;
                let xPos = i * this.cellWidth;
                let yPos = j * this.cellHeight;

                if (blipCount === 0) {
                    // Draw and empty cell
                    ctx.fillStyle = "#444";
                    ctx.fillRect(xPos, yPos, this.cellWidth, this.cellHeight);
                } else {
                    // Draw an occupied cell
                    ctx.fillStyle = "#666";
                    ctx.fillRect(xPos, yPos, this.cellWidth, this.cellHeight);

                    xPos += this.cellWidth / 2;
                    yPos += this.cellHeight / 2;
                    if (blipCount === 1) {
                        // If there is only one blip in a cell, draw it as an arrow
                        ctx.beginPath();
                        if (this.gridState[i][j][0] === BLIP_STATE.UP) {
                            ctx.moveTo(xPos + this.cellWidth / 4, yPos + this.cellHeight / 4);
                            ctx.lineTo(xPos - this.cellWidth / 4, yPos + this.cellHeight / 4);
                            ctx.lineTo(xPos, yPos - this.cellHeight / 4);
                        } else if (this.gridState[i][j][0] === BLIP_STATE.RIGHT) {
                            ctx.moveTo(xPos - this.cellWidth / 4, yPos + this.cellHeight / 4);
                            ctx.lineTo(xPos - this.cellWidth / 4, yPos - this.cellHeight / 4);
                            ctx.lineTo(xPos + this.cellWidth / 4, yPos);
                        } else if (this.gridState[i][j][0] === BLIP_STATE.DOWN) {
                            ctx.moveTo(xPos + this.cellWidth / 4, yPos - this.cellHeight / 4);
                            ctx.lineTo(xPos - this.cellWidth / 4, yPos - this.cellHeight / 4);
                            ctx.lineTo(xPos, yPos + this.cellHeight / 4);
                        } else if (this.gridState[i][j][0] === BLIP_STATE.LEFT) {
                            ctx.moveTo(xPos + this.cellWidth / 4, yPos - this.cellHeight / 4);
                            ctx.lineTo(xPos + this.cellWidth / 4, yPos + this.cellHeight / 4);
                            ctx.lineTo(xPos - this.cellWidth / 4, yPos);
                        }
                    } else {
                        // If there are multiple blips in a cell, draw them all as a circle
                        ctx.arc(xPos, yPos, Math.min(this.cellWidth, this.cellHeight) / 4, 0, 2 * Math.PI);
                    }
                    ctx.closePath();
                    ctx.fillStyle = "#fff";
                    ctx.fill();
                }

                // Draw the outline of the cell
                ctx.strokeRect(i * this.cellWidth, j * this.cellHeight, this.cellWidth, this.cellHeight);
            }
        }
    }

    // Gets the x, y position of a cell given a mouse position on the page
    GetCellPositionAtMouse(mouseEvent) {
        let rect = this.canvas.getBoundingClientRect();
        let x = mouseEvent.clientX - rect.left; 
        let y = mouseEvent.clientY - rect.top;
        return { x: Math.floor(x / this.cellWidth), y: Math.floor(y / this.cellHeight) };
    }

    // Rotates all blips in a cell clockwise
    // if removeLeft is true, remove left-facing blips instead of rotating them
    RotateBlipsInCell(x, y, removeLeft) {
        for (let i = this.gridState[x][y].length - 1; i >= 0; i--) {
            if (this.gridState[x][y][i] === BLIP_STATE.LEFT){
                if (removeLeft) {
                    this.gridState[x][y].splice(i, 1);
                } else {
                    this.gridState[x][y][i] = BLIP_STATE.UP;
                }
            } else {
                this.gridState[x][y][i] += 1;
            }
        }
    }

    // Reverses the direction of a blip
    FlipBlip(blip) {
        if (blip === BLIP_STATE.UP) return BLIP_STATE.DOWN;
        if (blip === BLIP_STATE.RIGHT) return BLIP_STATE.LEFT;
        if (blip === BLIP_STATE.DOWN) return BLIP_STATE.UP;
        if (blip === BLIP_STATE.LEFT) return BLIP_STATE.RIGHT;
        return blip;
    }

    // Convert a GridTune into an object
    Serialize() {
        // Encode each x, y, state as a 16-bit number
        // 7 bits: x, 7 bits: y, 2 bits: state
        // Store two states in each number within an array
        let cellCount = 0;
        let cellStates = [];
        for (let i = 0; i < this.gridWidth; i++) {
            for (let j = 0; j < this.gridHeight; j++) {
                for (let blip of this.gridState[i][j]) {
                    // Append a new number when needed
                    if (cellCount % 2 === 0) { cellStates.push(0); }

                    // Add the necesarry bits of information to a 16-bit number
                    let encodedNumber = 0;
                    encodedNumber |= i << 9;
                    encodedNumber |= j << 2;
                    encodedNumber |= blip - 1;

                    // Add the 16-bit number to the larger number for storing
                    cellStates[cellStates.length - 1] |= (encodedNumber << ((cellCount % 2) * 16));
                    
                    // Keep track of the number of stored cells
                    cellCount++;
                }
            }
        }

        // Indcate how many cell's worth of data is stored  in the array
        cellStates.unshift(cellCount);

        return [
            OSCILLATOR_TYPES.indexOf(this.oscillatorSelect.value),
            Number(this.synth.detune.value),
            cellStates
        ]
    }

    // Convert an object into a GridTune
    Deserialize(serialized) {
        this.SetOscillatorType(OSCILLATOR_TYPES[serialized[0]]);
        this.SetDetune(serialized[1]);

        // See "Serialize()" for encoding scheme
        for (let i = 0; i < serialized[2][0]; i++) {
            let relevantBits = (serialized[2][1 + Math.floor(i / 2)] >> ((i % 2) * 16)) & 0xffff;
            let x = (relevantBits >> 9) & 0b1111111;
            let y = (relevantBits >> 2) & 0b1111111;
            let state = 1 + (relevantBits & 0b11);
            this.gridState[x][y].push(state);
        }
    }
}