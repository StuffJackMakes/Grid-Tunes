<p align="center">
  <img height="128" src="./public/grid_tunes_logo.svg">
</p>

# Grid Tunes

`Grid Tunes` allows users create musical loops using blips moving  on a 2D grid and interacting with one another.

This repository contains a website that allows users to create musical loops by placing *blips* on a grid. These *blips* move around interacting with one another as well as the grid edges, producing sound in a repeating fashion. The notes are generated in Javascript using [Tone.js](https://tonejs.github.io/).

<p align="center">
  <img height="512" src="./example_image.jpg">
</p>


## Live Example

A live example of this website is hosted at [https://stuffjackmakes.com/grid-tunes/](https://stuffjackmakes.com/grid-tunes/).


## How it Works

Each *blip* on the grid has a direction (up, down, left, right) that it moves towards each time step. When multiple *blips* enter the same grid cell, they each rotate 90 degrees clockwise. Note that two *blips* may pass through one another if they are adjacent and facing towards each other - in which case each *blip* would end up in the cell where the other *blip* was previously. When a *blip* encounters the edge of the grid, it plays the note corresponding to its row or column (depending on if it hit the top/bottom or the left/right sides) and reverses direction.


## Limitations

* You cannot currently export any music as an audio file
* Some loops created can be exceedingly long, and thus not seem like a loop while listening
* Having too many sounds going off may result in audio distortion


## Did You Know?

While Javascript stores all numbers a [64-bit doubles](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number), it apparently casts each number to a [32-bit float](https://developer.mozilla.org/En/Core_JavaScript_1.5_Reference/Operators/Bitwise_Operators) for bitwise operations.


## Setup

Host the `index.html` file with your software of choice and you're done!


## Author

Check out my other work at [stuffjackmakes.com](https://stuffjackmakes.com)