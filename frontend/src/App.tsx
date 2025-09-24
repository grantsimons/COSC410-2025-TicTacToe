"use client";
import { useEffect, useState } from "react";
import TicTacToe from "@/components/TicTacToe";

// ----- DTO types -----
export type Player = "X" | "O";
export type Cell = Player | null;

export type GameStateDTO = {
  id: string;
  board: Cell[];
  current_player: Player;
  winner: Player | null;
  is_draw: boolean;
  status: string;
};

export type SuperGameStateDTO = {
  id: string; // backend-provided UUID
  boards: GameStateDTO[];
  major_winner: Player | null;
  major_draw: boolean;
};

export default function App() {
  const [superGame, setSuperGame] = useState<SuperGameStateDTO | null>(null);
  const [activePlayer, setActivePlayer] = useState<Player>("X");
  const [activeBoard, setActiveBoard] = useState<number | null>(null);

  const displayStatus = superGame
    ? superGame.major_winner
      ? `🎉 ${superGame.major_winner} wins the Super Game!`
      : superGame.major_draw
      ? "Super Game Draw"
      : `${activePlayer}'s turn`
    : "Loading...";

  useEffect(() => {
    resetSuperGame();
  }, []);

  async function resetSuperGame() {
    try {
      const res = await fetch("http://localhost:8000/tictactoe/super/new", {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to fetch new Super Game");
  
      const newSuperGame: SuperGameStateDTO = await res.json();
      setSuperGame(newSuperGame); // use backend UUID
      setActivePlayer("X");
      setActiveBoard(null);
    } catch (err) {
      console.error("Failed to reset Super Game:", err);
    }
  }

  async function handleMove(boardIndex: number, cellIndex: number) {
    if (!superGame) return;
    const board = superGame.boards[boardIndex];

    // Block invalid moves
    if (superGame.major_winner || superGame.major_draw) return;
    if (activeBoard !== null && activeBoard !== boardIndex) return;
    if (board.winner || board.board[cellIndex]) return;

    try {
      const res = await fetch(
        `http://localhost:8000/tictactoe/${superGame.id}/super/move?board_index=${boardIndex}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ index: cellIndex, symbol: activePlayer }),
        }
      );
      if (!res.ok) throw new Error("Move failed");

      const updatedSuperGame: SuperGameStateDTO = await res.json();
      setSuperGame(updatedSuperGame);

      // Flip active player
      const nextPlayer: Player = activePlayer === "X" ? "O" : "X";
      setActivePlayer(nextPlayer);

      // Determine next active board
      let nextActiveBoard: number | null = cellIndex;
      const targetBoard = updatedSuperGame.boards[nextActiveBoard];
      if (!targetBoard || targetBoard.winner || targetBoard.is_draw) {
        nextActiveBoard = null; // free choice if target board is complete
      }
      setActiveBoard(nextActiveBoard);
    } catch (err) {
      console.error("Move failed:", err);
    }
  }

  return (
    <div className="flex flex-col items-center space-y-4 p-4">
      <h1 className="text-2xl font-bold">{displayStatus}</h1>

      <button
        onClick={resetSuperGame}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        New Game
      </button>

      <div className="grid grid-cols-3 gap-4 mt-4">
        {superGame?.boards.map((board, i) => (
          <TicTacToe
            key={board.id}
            game={board}
            onMove={(cellIndex) => handleMove(i, cellIndex)}
            isActive={activeBoard === null || activeBoard === i}
          />
        ))}
      </div>
    </div>
  );
}
