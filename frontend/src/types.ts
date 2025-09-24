export type Player = "X" | "O";
export type Cell = Player | null;

export interface GameStateDTO {
  id: string;
  board: Cell[];
  current_player: Player;
  winner: Player | null;
  is_draw: boolean;
  status: string;
}
