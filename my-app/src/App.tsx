import React from "react";
import { useState, useCallback, useEffect } from "react";
import produce from "immer";
import axios from "axios";
import { io } from "socket.io-client";
import styled from "styled-components";

const Button = styled.button`
  color: darkblue;
  font-size: 1em;
  margin: 1em;
  padding: 0.25em 1em;
  border: 2px solid darkblue;
  border-radius: 3px;
  background-color: white;
`;

const TitleContainer = styled.h1`
  display: flex;
  flex-direction: column;
  align-items: center;
`;
const CenterContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
`;

const Container = styled.p`
  color: darkblue;
  font-size: 1em;
  margin: 1em;
  padding: 0.25em 1em;
  border: 2px solid lightblue;
  border-radius: 3px;
  width: fit-content;
  background-color: lightblue;
  font-weight: bold;
`;

const App: React.FC = () => {
  const numRows = 50;
  const numCols = 50;

  //initials the grid with all dead cells for the first render
  const generateEmptyGrid = () => {
    const rows = [];
    for (let i = 0; i < numRows; i++) {
      rows.push(Array.from(Array(numCols), () => 0));
    }
    return rows;
  };
  const [grid, setGrid] = useState(() => {
    return generateEmptyGrid();
  });
  const [running, setRunning] = useState(false);
  const [generation, setGeneration] = useState(0);
  const runningRef = React.useRef(running);
  runningRef.current = running;

  function callForEmptyGrid() {
    //this function is called when the user clicks on the "Reset Grid" button
    axios
      .get("http://localhost:8000/empty")
      .then((res) => {
        setGrid(res.data);
      })
      .catch((err) => {
        console.log(err);
      });

    setGeneration(0);
  }

  function callForRandomGrid() {
    //this function is called when the user clicks on the "Random Grid" button
    axios
      .get("http://localhost:8000/random")
      .then((res) => {
        setGrid(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  }
  const socket = io("http://localhost:8000", { transports: ["websocket"] });

  useEffect(() => {
    //socket connection
    socket.connect();
  }, []);

  socket.on("fetchOneStep", (data, generations) => {
    //this function is called when the user clicks on the "Next" button
    // and fetches the next generation from the server
    let result = JSON.parse(data);
    setGeneration(generations);
    setGrid(result);
  });

  socket.on("fetchSimulation", (data, generations) => {
    //this event triggers when the user clicks on the "Start" button
    //from callForSimulation function
    setGeneration(generations);
    if (!running) {
      let result = JSON.parse(data);
      setGrid(result);
    } else {
      return;
    }
  });

  socket.on("reset", () => {
    //this function is called when the user clicks on the "Reset" button
    // and resets the grid to the initial state
    setGrid(generateEmptyGrid());
  });

  function callForRunSimulation(running: boolean) {
    //this function is called when the user clicks on the "Start" button
    // and starts the simulation with setInterval
    if (!running) {
      socket.emit("runSimulation", grid);
    } else {
      socket.emit("stopSimulation");
    }
  }

  function callForRunSimulationOnce() {
    //this function is called when the user clicks on the "Next" button
    // and fetches the next generation from the server
    socket.emit("onestep", grid);
  }

  return (
    <>
      <TitleContainer> Game Of Life Assignment - Talkspace</TitleContainer>
      <CenterContainer>
        <Button
          disabled={running}
          style={{
            backgroundColor: running ? "lightgray" : "white",
          }}
          onClick={() => {
            callForEmptyGrid();
          }}
        >
          Reset Grid
        </Button>
        <Button
          disabled={running}
          style={{
            backgroundColor: running ? "lightgray" : "white",
          }}
          onClick={() => {
            callForRandomGrid();
          }}
        >
          Random Grid
        </Button>
        <Button
          disabled={running}
          style={{
            backgroundColor: running ? "lightgray" : "white",
          }}
          onClick={() => {
            callForRunSimulationOnce();
          }}
        >
          Next
        </Button>
        <Button
          onClick={() => {
            callForRunSimulation(running);
            setRunning(!running);
            console.log("running is " + running);
          }}
        >
          {running ? "Stop" : "Start"}
        </Button>
      </CenterContainer>
      <CenterContainer>
        <Container>Generation: {generation}</Container>
      </CenterContainer>
      <CenterContainer>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${numCols},30px)`,
          }}
        >
          {grid.map((row, i) =>
            row.map((col, j) => (
              <div
                style={{
                  width: 30,
                  height: 30,
                  backgroundColor: grid[i][j] ? "yellow" : "blue",
                  border: "solid 0.5px black",
                }}
                key={i + j}
                onClick={() => {
                  const newGrid = produce(grid, (gridCopy) => {
                    gridCopy[i][j] = grid[i][j] ? 0 : 1;
                  });
                  setGrid(newGrid);
                }}
              />
            ))
          )}
        </div>
      </CenterContainer>
    </>
  );
};

export default App;
