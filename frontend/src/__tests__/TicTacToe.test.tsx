import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import TicTacToe from "../components/TicTacToe";
import { GameStateDTO, Cell, Player } from "../types";

function TicTacToeTestWrapper({ initialGame }: { initialGame: GameStateDTO }) {
  const [game, setGame] = React.useState(initialGame);

  const handleMove = (index: number) => {
    if (game.board[index] !== null || game.winner) return;

    const newBoard = [...game.board];
    newBoard[index] = game.current_player as Cell;
    const nextPlayer = game.current_player === "X" ? "O" : "X";

    let winner: Cell | null = null;
    const winLines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    for (const [a, b, c] of winLines) {
      if (newBoard[a] && newBoard[a] === newBoard[b] && newBoard[a] === newBoard[c]) {
        winner = newBoard[a];
      }
    }

    const isDraw = !winner && newBoard.every(cell => cell !== null);

    setGame({
      ...game,
      board: newBoard,
      current_player: nextPlayer,
      winner,
      is_draw: isDraw,
    });
  };

  const handleReset = () => {
    setGame({
      ...game,
      board: Array(9).fill(null) as Cell[],
      current_player: "X",
      winner: null,
      is_draw: false,
      status: "playing",
    });
  };

  return (
    <div>
      <div data-testid="current-player">{game.current_player}</div>
      <div data-testid="winner">{game.winner}</div>
      <div data-testid="is-draw">{game.is_draw ? "true" : "false"}</div>
      <TicTacToe game={game} onMove={handleMove} isActive={true} />
      <button onClick={handleReset}>New Game</button>
    </div>
  );
}

describe("TicTacToe component (UI-only, API-like logic)", () => {
  let initialGame: GameStateDTO;

  beforeEach(() => {
    initialGame = {
      id: "test-board",
      board: Array(9).fill(null) as Cell[],
      current_player: "X",
      winner: null,
      is_draw: false,
      status: "playing",
    };
  });

  // Helper to get only board cells (exclude "New Game" button)
  const getBoardCells = () =>
    screen.getAllByRole("button").filter(btn => btn.textContent !== "New Game");

  it("plays a simple game and declares winner", () => {
    render(<TicTacToeTestWrapper initialGame={initialGame} />);
    const cells = getBoardCells();

    fireEvent.click(cells[0]); // X
    fireEvent.click(cells[3]); // O
    fireEvent.click(cells[1]); // X
    fireEvent.click(cells[4]); // O
    fireEvent.click(cells[2]); // X wins

    expect(screen.getByTestId("winner").textContent).toBe("X");
    expect(cells[0].textContent).toBe("X");
    expect(cells[1].textContent).toBe("X");
    expect(cells[2].textContent).toBe("X");
  });

  it("prevents moves in occupied cells", () => {
    render(<TicTacToeTestWrapper initialGame={initialGame} />);
    const cells = getBoardCells();

    fireEvent.click(cells[0]);
    fireEvent.click(cells[0]); // attempt overwrite

    expect(cells[0].textContent).toBe("X"); // still X
  });

  it("can start a new game after finishing", () => {
    const finishedGame: GameStateDTO = {
      ...initialGame,
      board: ["X", "X", "X", "O", "O", null, null, null, null] as Cell[],
      winner: "X" as Cell,
      current_player: "X",
    };

    render(<TicTacToeTestWrapper initialGame={finishedGame} />);
    fireEvent.click(screen.getByText(/New Game/i));

    const cells = getBoardCells();
    cells.forEach(cell => expect(cell.textContent).toBe(""));
    expect(screen.getByTestId("winner").textContent).toBe("");
    expect(screen.getByTestId("current-player").textContent).toBe("X");
  });

  it("detects a draw game", () => {
    render(<TicTacToeTestWrapper initialGame={initialGame} />);
    const cells = getBoardCells();
    const moves = [0, 1, 2, 4, 3, 5, 7, 6, 8];
    moves.forEach(i => fireEvent.click(cells[i]));

    expect(screen.getByTestId("winner").textContent).toBe("");
    expect(screen.getByTestId("is-draw").textContent).toBe("true");
  });

  it("switches current player after each move", () => {
    render(<TicTacToeTestWrapper initialGame={initialGame} />);
    const cells = getBoardCells();

    fireEvent.click(cells[0]); // X
    expect(screen.getByTestId("current-player").textContent).toBe("O");

    fireEvent.click(cells[1]); // O
    expect(screen.getByTestId("current-player").textContent).toBe("X");
  });

  it("UI updates immediately after move", () => {
    render(<TicTacToeTestWrapper initialGame={initialGame} />);
    const cells = getBoardCells();

    fireEvent.click(cells[0]); // X
    expect(cells[0].textContent).toBe("X");

    fireEvent.click(cells[1]); // O
    expect(cells[1].textContent).toBe("O");
  });

  it("resets the board correctly", () => {
    render(<TicTacToeTestWrapper initialGame={initialGame} />);
    const cells = getBoardCells();

    fireEvent.click(cells[0]);
    fireEvent.click(cells[1]);

    fireEvent.click(screen.getByText(/New Game/i));

    const newCells = getBoardCells();
    newCells.forEach(cell => expect(cell.textContent).toBe(""));
    expect(screen.getByTestId("winner").textContent).toBe("");
    expect(screen.getByTestId("current-player").textContent).toBe("X");
  });
});
