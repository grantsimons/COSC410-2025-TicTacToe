"use client";
import { useEffect, useState } from "react";
import TicTacToe from "@/components/TicTacToe";

// ----- DTO types -----
export type Player = "X" | "O";
export type Cell = Player | null;

export type GameStateDTO = {
  id: string;
  board: Cell[];
  winner: Player | null;
  is_draw: boolean;
  status: string;
};

export default function App() {
  const [games, setGames] = useState<GameStateDTO[]>([]);
  const [status, setStatus] = useState("Loading...");
  const [activeBoard, setActiveBoard] = useState<number | null>(null);
  const [activePlayer, setActivePlayer] = useState<Player>("X"); // global active player

  useEffect(() => {
    resetAll();
  }, []);

  // Reset all 9 boards
  async function resetAll() {
    const newGames: GameStateDTO[] = [];
    for (let i = 0; i < 9; i++) {
      // Start empty boards; backend can still create a game, but we ignore current_player
      const res = await fetch("http://localhost:8000/tictactoe/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ starting_player: activePlayer }), // ensure backend knows who starts
      });
      const game = await res.json();
      // Force empty board, ignore backend’s current_player
      game.board = Array(9).fill(null);
      game.winner = null;
      game.is_draw = false;
      newGames.push(game);
    }
    setGames(newGames);
    setActivePlayer("X"); // reset active player
    setStatus("X's turn");
    setActiveBoard(null); // free choice on first move
  }

  // Handle move on a board
  async function handleMove(boardIndex: number, cellIndex: number) {
    // Only allow move if board is active
    if (activeBoard !== null && activeBoard !== boardIndex) return;

    const game = games[boardIndex];
    if (game.winner || game.board[cellIndex]) return;

    // Send frontend activePlayer to backend for consistency
    const res = await fetch(
      `http://localhost:8000/tictactoe/${game.id}/move`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ index: cellIndex, player: activePlayer }),
      }
    );
    const updatedGame = await res.json();

    // Force frontend board to reflect activePlayer
    updatedGame.board[cellIndex] = activePlayer;

    const updatedGames = [...games];
    updatedGames[boardIndex] = updatedGame;
    setGames(updatedGames);

    // Flip player for next move
    const nextPlayer: Player = activePlayer === "X" ? "O" : "X";
    setActivePlayer(nextPlayer);
    setStatus(`${nextPlayer}'s turn`);

    // Determine next active board
    let nextActiveBoard: number | null = cellIndex;
    const targetBoard = updatedGames[nextActiveBoard];
    if (targetBoard?.winner || targetBoard?.is_draw) {
      nextActiveBoard = null; // free choice if board won/drawn
    }
    setActiveBoard(nextActiveBoard);
  }

  return (
    <div className="flex flex-col items-center space-y-4 p-4">
      {/* Global status */}
      <h1 className="text-2xl font-bold">{status}</h1>

      {/* New Game button */}
      <button
        onClick={resetAll}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        New Game
      </button>

      {/* 9-board grid */}
      <div className="grid grid-cols-3 gap-4 mt-4">
        {games.map((game, i) => (
          <TicTacToe
            key={i}
            game={game}
            onMove={(cellIndex) => handleMove(i, cellIndex)}
            isActive={activeBoard === null || activeBoard === i} // highlight active board
          />
        ))}
      </div>
    </div>
  );
}
