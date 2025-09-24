from __future__ import annotations
from dataclasses import dataclass, field
from typing import List, Literal, Optional, Tuple

# ----- Types -----
Player = Literal["X", "O"]
Cell = Optional[Player]

# ----- Minor Board Winning Lines -----
WIN_LINES: Tuple[Tuple[int, int, int], ...] = (
    (0, 1, 2),
    (3, 4, 5),
    (6, 7, 8),  # rows
    (0, 3, 6),
    (1, 4, 7),
    (2, 5, 8),  # cols
    (0, 4, 8),
    (2, 4, 6),  # diagonals
)

# -----------------------
# Minor Board
# -----------------------
@dataclass
class GameState:
    board: List[Cell] = field(default_factory=lambda: [None] * 9)
    current_player: Player = "X"
    winner: Optional[Player] = None
    is_draw: bool = False

    def copy(self) -> GameState:
        return GameState(
            board=self.board.copy(),
            current_player=self.current_player,
            winner=self.winner,
            is_draw=self.is_draw,
        )


def _check_winner(board: List[Cell]) -> Optional[Player]:
    for a, b, c in WIN_LINES:
        if board[a] is not None and board[a] == board[b] == board[c]:
            return board[a]
    return None


def _is_full(board: List[Cell]) -> bool:
    return all(cell is not None for cell in board)


def new_game() -> GameState:
    return GameState()


def move(state: GameState, index: int, symbol: Player) -> GameState:
    if state.winner or state.is_draw:
        raise ValueError("Game is already over.")
    if not (0 <= index < 9):
        raise IndexError("Index must be in range [0, 8].")
    if state.board[index] is not None:
        raise ValueError("Cell already occupied.")

    state.board[index] = symbol  # mutate in-place

    winner = _check_winner(state.board)
    if winner:
        state.winner = winner
    elif _is_full(state.board):
        state.is_draw = True

    # Flip current player
    state.current_player = "O" if symbol == "X" else "X"
    return state


def available_moves(state: GameState) -> List[int]:
    return [i for i, cell in enumerate(state.board) if cell is None]


def status(state: GameState) -> str:
    if state.winner:
        return f"{state.winner} wins"
    if state.is_draw:
        return "draw"
    return f"{state.current_player}'s turn"


# -----------------------
# Super Game (9 Boards)
# -----------------------
@dataclass
class SuperGameState:
    boards: List[GameState] = field(default_factory=lambda: [new_game() for _ in range(9)])
    major_winner: Optional[Player] = None
    major_draw: bool = False


def move_super(sgs: SuperGameState, board_index: int, cell_index: int, symbol: Player) -> None:
    if sgs.major_winner or sgs.major_draw:
        raise ValueError("Super Game is over")
    if not (0 <= board_index < 9):
        raise IndexError("Invalid board index")

    # Make move on minor board
    move(sgs.boards[board_index], cell_index, symbol)

    # Check for major winner
    winners = [b.winner for b in sgs.boards]
    for player in ["X", "O"]:
        lines = WIN_LINES
        for a, b, c in lines:
            if winners[a] == winners[b] == winners[c] == player:
                sgs.major_winner = player
                return

    # Check if all boards complete without major winner
    if all(b.winner or b.is_draw for b in sgs.boards):
        sgs.major_draw = True
