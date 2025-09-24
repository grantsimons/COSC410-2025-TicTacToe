from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

Player = Literal["X", "O"]


class GameCreate(BaseModel):
    starting_player: Player | None = Field(default="X")


class GameStateDTO(BaseModel):
    # Deprecated: kept for typing imports; main API now returns SuperGameStateDTO
    id: str
    board: list[Player | None]
    current_player: Player
    winner: Player | None
    is_draw: bool
    status: str


class MoveRequest(BaseModel):
    # Deprecated: main API now accepts SuperMoveRequest
    index: int


# ============================
# Super Tic-Tac-Toe Schemas
# ============================


class SuperGameCreate(BaseModel):
    starting_player: Player | None = Field(default="X")


class SuperMiniBoardDTO(BaseModel):
    cells: list[Player | None]
    winner: Player | None
    is_draw: bool


class SuperGameStateDTO(BaseModel):
    id: str
    boards: list[SuperMiniBoardDTO]
    current_player: Player
    active_board: int | None
    global_winner: Player | None
    is_global_draw: bool
    status: str


class SuperMoveRequest(BaseModel):
    board_index: int
    cell_index: int
