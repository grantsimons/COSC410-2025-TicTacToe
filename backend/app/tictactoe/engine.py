from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Literal

Player = Literal["X", "O"]
Cell = Player | None

WIN_LINES: tuple[tuple[int, int, int], ...] = (
    (0, 1, 2),
    (3, 4, 5),
    (6, 7, 8),  # rows
    (0, 3, 6),
    (1, 4, 7),
    (2, 5, 8),  # cols
    (0, 4, 8),
    (2, 4, 6),  # diagonals
)


@dataclass
class GameState:
    board: list[Cell] = field(default_factory=lambda: [None] * 9)
    current_player: Player = "X"
    winner: Player | None = None
    is_draw: bool = False

    def copy(self) -> GameState:
        return GameState(self.board.copy(), self.current_player, self.winner, self.is_draw)


def _check_winner(board: list[Cell]) -> Player | None:
    for a, b, c in WIN_LINES:
        if board[a] is not None and board[a] == board[b] == board[c]:
            return board[a]
    return None


def _is_full(board: list[Cell]) -> bool:
    return all(cell is not None for cell in board)


def new_game() -> GameState:
    return GameState()


def move(state: GameState, index: int) -> GameState:
    if state.winner or state.is_draw:
        raise ValueError("Game is already over.")
    if not (0 <= index < 9):
        raise IndexError("Index must be in range [0, 8].")
    if state.board[index] is not None:
        raise ValueError("Cell already occupied.")

    next_state = state.copy()
    next_state.board[index] = state.current_player

    w = _check_winner(next_state.board)
    if w:
        next_state.winner = w
    elif _is_full(next_state.board):
        next_state.is_draw = True
    else:
        next_state.current_player = "O" if state.current_player == "X" else "X"
    return next_state


def available_moves(state: GameState) -> list[int]:
    return [i for i, cell in enumerate(state.board) if cell is None]


def status(state: GameState) -> str:
    if state.winner:
        return f"{state.winner} wins"
    if state.is_draw:
        return "draw"
    return f"{state.current_player}'s turn"


"""
Super Tic-Tac-Toe helpers as dict-based utilities, reusing classic winner/full checks.
State shape:
{
  'boards': [ { 'cells': List[Cell], 'winner': Optional[Player], 'is_draw': bool } x9 ],
  'current_player': Player,
  'global_winner': Optional[Player],
  'is_global_draw': bool,
  'active_board': Optional[int],
}
"""


def super_new_game() -> dict[str, Any]:
    boards = [
        {"cells": [None] * 9, "winner": None, "is_draw": False}  # type: ignore[list-item]
        for _ in range(9)
    ]
    return {
        "boards": boards,
        "current_player": "X",
        "global_winner": None,
        "is_global_draw": False,
        "active_board": None,
    }


def _check_global_winner_dict(state: dict[str, Any]) -> Player | None:
    owners: list[Player | None] = [b["winner"] for b in state["boards"]]
    for a, b, c in WIN_LINES:
        if owners[a] is not None and owners[a] == owners[b] == owners[c]:
            return owners[a]
    return None


def _all_boards_closed_dict(state: dict[str, Any]) -> bool:
    return all(b["winner"] is not None or b["is_draw"] for b in state["boards"])


def super_available_boards_dict(state: dict[str, Any]) -> list[int]:
    active = state["active_board"]
    boards = state["boards"]
    if active is not None:
        b = boards[active]
        if b["winner"] is None and not b["is_draw"]:
            return [active]
    return [i for i, b in enumerate(boards) if b["winner"] is None and not b["is_draw"]]


def super_move(state: dict[str, Any], board_index: int, cell_index: int) -> dict[str, Any]:
    if state["global_winner"] or state["is_global_draw"]:
        raise ValueError("Game is already over.")
    if not (0 <= board_index < 9):
        raise IndexError("Board index must be in range [0, 8].")

    allowed = super_available_boards_dict(state)
    if board_index not in allowed:
        if state["active_board"] is not None:
            raise ValueError(f"Must play in board {state['active_board']}.")
        else:
            raise ValueError("Selected board is closed.")

    # copy-on-write
    next_state: dict[str, Any] = {
        **state,
        "boards": [
            {"cells": b["cells"].copy(), "winner": b["winner"], "is_draw": b["is_draw"]}
            for b in state["boards"]
        ],
    }

    board = next_state["boards"][board_index]
    if board["winner"] or board["is_draw"]:
        raise ValueError("Mini-board is already closed.")
    if not (0 <= cell_index < 9):
        raise IndexError("Cell index must be in range [0, 8].")
    if board["cells"][cell_index] is not None:
        raise ValueError("Cell already occupied.")

    board["cells"][cell_index] = state["current_player"]
    w = _check_winner(board["cells"])
    if w:
        board["winner"] = w
    elif _is_full(board["cells"]):
        board["is_draw"] = True

    gw = _check_global_winner_dict(next_state)
    if gw:
        next_state["global_winner"] = gw
    elif _all_boards_closed_dict(next_state):
        next_state["is_global_draw"] = True

    next_state["active_board"] = cell_index
    ab = next_state["active_board"]
    if next_state["boards"][ab]["winner"] is not None or next_state["boards"][ab]["is_draw"]:
        next_state["active_board"] = None

    if not next_state["global_winner"] and not next_state["is_global_draw"]:
        next_state["current_player"] = "O" if state["current_player"] == "X" else "X"

    return next_state


def super_status(state: dict[str, Any]) -> str:
    if state["global_winner"]:
        return f"{state['global_winner']} wins"
    if state["is_global_draw"]:
        return "draw"
    if state["active_board"] is None:
        return f"{state['current_player']}'s turn — any board"
    return f"{state['current_player']}'s turn — board {state['active_board']}"
