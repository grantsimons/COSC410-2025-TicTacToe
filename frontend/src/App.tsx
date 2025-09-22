"use client";
import { useEffect, useState } from "react";
import TicTacToe from "@/components/TicTacToe";

// ----- Central DTO -----
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

export default function App() {
  const [games, setGames] = useState<GameStateDTO[]>([]);
  const [status, setStatus] = useState("Loading...");

  useEffect(() => {
    resetAll();
  }, []);

  async function resetAll() {
    const newGames: GameStateDTO[] = [];
    for (let i = 0; i < 9; i++) {
      const res = await fetch("http://localhost:8000/tictactoe/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ starting_player: "X" }),
      });
      newGames.push(await res.json());
    }
    setGames(newGames);
    setStatus("X's turn");
  }

  async function handleMove(boardIndex: number, cellIndex: number) {
    const game = games[boardIndex];
    if (game.winner || game.board[cellIndex]) return;

    const res = await fetch(
      `http://localhost:8000/tictactoe/${game.id}/move`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ index: cellIndex }),
      }
    );
    const updatedGame = await res.json();

    const updatedGames = [...games];
    updatedGames[boardIndex] = updatedGame;
    setGames(updatedGames);

    setStatus(updatedGame.status);
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <h1 className="text-xl font-bold">{status}</h1>
      <button
        onClick={resetAll}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        New Game
      </button>

      <div className="grid grid-cols-3 gap-4">
        {games.map((game, i) => (
          <TicTacToe
            key={game.id}
            game={game}
            onMove={(cellIndex) => handleMove(i, cellIndex)}
          />
        ))}
      </div>
    </div>
  );
}
