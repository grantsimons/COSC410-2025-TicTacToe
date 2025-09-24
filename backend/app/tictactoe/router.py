from uuid import uuid4
from fastapi import APIRouter, HTTPException, Query
from typing import List

from .engine import GameState, move, new_game, status, move_super, SuperGameState
from .schemas import GameCreate, GameStateDTO, MoveRequest, SuperGameStateDTO

router = APIRouter(prefix="/tictactoe", tags=["tictactoe"])

# In-memory stores
GAMES: dict[str, List[GameState]] = {}
SUPER_GAMES: dict[str, SuperGameState] = {}

# --- Helper functions ---
def _to_dto(game_id: str, gs: GameState) -> GameStateDTO:
    return GameStateDTO(
        id=game_id,
        board=gs.board,
        current_player=gs.current_player,
        winner=gs.winner,
        is_draw=gs.is_draw,
        status=status(gs),
    )


def _to_super_dto(game_id: str, sgs: SuperGameState) -> SuperGameStateDTO:
    return SuperGameStateDTO(
        id=game_id,
        boards=[_to_dto(f"{game_id}_{i}", b) for i, b in enumerate(sgs.boards)],
        major_winner=sgs.major_winner,
        major_draw=sgs.major_draw,
    )


# --- Standard game routes ---
@router.post("/new", response_model=GameStateDTO)
def create_game(payload: GameCreate):
    gs = new_game()
    gs.current_player = payload.starting_player or "X"

    gid = str(uuid4())
    GAMES[gid] = [gs]

    return _to_dto(gid, gs)


@router.post("/{game_id}/move", response_model=GameStateDTO)
def make_move(game_id: str, payload: MoveRequest):
    if game_id not in GAMES:
        raise HTTPException(status_code=404, detail="Game not found.")

    gs = GAMES[game_id][-1]

    if gs.winner or gs.is_draw:
        raise HTTPException(status_code=400, detail="Game is already over.")

    if payload.symbol not in ["X", "O"]:
        raise HTTPException(status_code=400, detail="Invalid symbol.")

    try:
        move(gs, payload.index, payload.symbol)
    except (IndexError, ValueError) as e:
        raise HTTPException(status_code=400, detail=str(e))

    GAMES[game_id].append(gs.copy())
    return _to_dto(game_id, gs)


# --- Super game routes ---
@router.post("/super/new", response_model=SuperGameStateDTO)
def create_super_game():
    game_id = str(uuid4())
    sgs = SuperGameState()
    SUPER_GAMES[game_id] = sgs
    return _to_super_dto(game_id, sgs)


@router.post("/{game_id}/super/move", response_model=SuperGameStateDTO)
def make_super_move(
    game_id: str,
    board_index: int = Query(..., ge=0, le=8),
    payload: MoveRequest = ...
):
    if game_id not in SUPER_GAMES:
        raise HTTPException(status_code=404, detail="Super Game not found.")

    sgs = SUPER_GAMES[game_id]

    if payload.symbol not in ["X", "O"]:
        raise HTTPException(status_code=400, detail="Invalid symbol")

    try:
        move_super(sgs, board_index, payload.index, payload.symbol)
    except (ValueError, IndexError) as e:
        raise HTTPException(status_code=400, detail=str(e))

    return _to_super_dto(game_id, sgs)
