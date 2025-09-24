from pydantic import BaseModel
from typing import List, Optional

# --- Standard game DTO ---
class GameStateDTO(BaseModel):
    id: str
    board: list[Optional[str]]  # or list["X"|"O"|None]
    current_player: str
    winner: Optional[str] = None
    is_draw: bool = False
    status: str

# --- Game creation ---
class GameCreate(BaseModel):
    starting_player: Optional[str] = "X"

# --- Move request ---
class MoveRequest(BaseModel):
    index: int
    symbol: str  # "X" or "O"

# --- Super game DTO ---
class SuperGameStateDTO(BaseModel):
    id: str                   # ✅ add this
    boards: List[GameStateDTO]
    major_winner: Optional[str] = None
    major_draw: bool = False
