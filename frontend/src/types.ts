// types.ts

export type Player = "X" | "O";
export type Cell = Player | null;

export type GameStateDTO = {
  id: string;
  board: Cell[];
  current_player: Player;   // ← backend-driven
  winner: Player | null;
  is_draw: boolean;
  status: string;
};
