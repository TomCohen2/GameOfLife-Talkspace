const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
require("events").EventEmitter.defaultMaxListeners = 15;

var cors = require("cors");

app.use(cors());

const port = 8000;

// hard coded grid sizes
const numRows = 50;
const numCols = 50;

app.get("/generations", (req, res) => {
  //sends the num of generations to the client
  res.send(generations);
});

app.get("/empty", (req, res) => {
  // Create a new empty grid and send it to the client
  const rows = [];
  for (let i = 0; i < numRows; i++) {
    rows.push(Array.from(Array(numCols), () => 0));
  }
  generations = 0;
  res.send(rows);
});

app.get("/random", (req, res) => {
  // Function to create random grid and send to client
  const rows = [];
  for (let i = 0; i < numRows; i++) {
    rows.push(Array.from(Array(numCols), () => (Math.random() > 0.7 ? 1 : 0)));
  }
  res.send(rows);
});

//basics server's variables
let running = false;
let grid;
let interval;
let generations = 0;

// socket connection to the client
io.on("connection", (socket) => {
  socket.on("onestep", (grid) => {
    // onestep event
    generations++;
    let newGrid = grid;
    let result = nextGeneration(newGrid, numRows, numCols);

    io.emit("fetchOneStep", JSON.stringify(result), generations);
  });

  socket.on("runSimulation", (grid) => {
    // runSimulation event (runs the game)
    interval = setInterval(() => {
      generations++;

      let newGrid = grid;
      let result = nextGeneration(newGrid, numRows, numCols);
      grid = result;
      io.emit("fetchSimulation", JSON.stringify(result), generations); // send the result to the client
    }, 500);
  });

  socket.on("stopSimulation", () => {
    // stopSimulation event (stops the game)
    clearInterval(interval);
  });

  socket.on("disconnect", () => {
    // disconnect event (clears the interval)
    if (interval) {
      if (interval._repeat) {
        clearInterval(interval);
        generations = 0;
      }
    }
  });
});

server.listen(port, () => {
  console.log(`listening on *:${port}`); // server listening on port 8000
});

const M = 50;
const N = 50;

// Function to create next generation
//Main Logic of the Game
function nextGeneration(grid, M, N) {
  let future = new Array(M); // Create a future array to send to the client
  for (let i = 0; i < M; i++) {
    future[i] = new Array(N).fill(0);
  }

  // Loop through every cell
  for (let l = 0; l < M; l++) {
    for (let m = 0; m < N; m++) {
      // finding num Of Neighbours that are alive
      let aliveNeighbours = 0;
      for (let i = -1; i < 2; i++) {
        for (let j = -1; j < 2; j++) {
          if (l + i >= 0 && l + i < M && m + j >= 0 && m + j < N)
            aliveNeighbours += grid[l + i][m + j];
        }
      }

      // The cell needs to be subtracted from
      // its neighbours as it was counted before
      aliveNeighbours -= grid[l][m];

      // Implementing the Rules of Life

      // Cell is lonely and dies
      if (grid[l][m] == 1 && aliveNeighbours < 2) future[l][m] = 0;
      // Cell dies due to over population
      else if (grid[l][m] == 1 && aliveNeighbours > 3) future[l][m] = 0;
      // A new cell is born
      else if (grid[l][m] == 0 && aliveNeighbours == 3) future[l][m] = 1;
      // Remains the same
      else future[l][m] = grid[l][m];
    }
  }
  return future;
}
