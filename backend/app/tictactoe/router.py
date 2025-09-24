from fastapi import APIRouter, HTTPException
from uuid import uuid4
from typing import Dict, List
from .engine import GameState, new_game, move, status
from .schemas import GameCreate, GameStateDTO, MoveRequest

router = APIRouter(prefix="/tictactoe", tags=["tictactoe"])

# naive in-memory store
GAMES: Dict[str, List[GameState]] = {}

def _to_dto(game_id: str, gs: GameState) -> GameStateDTO:
    return GameStateDTO(
        id=game_id,
        board=gs.board,
        current_player=gs.current_player,
        winner=gs.winner,
        is_draw=gs.is_draw,
        status=status(gs),
    )

@router.post("/new", response_model=GameStateDTO)
def create_game(payload: GameCreate) -> GameStateDTO:
    gs = new_game()
    gs.current_player = payload.starting_player or "X"

    gid = str(uuid4())
    GAMES[gid] = [gs]

    print(f"[CREATE] Game {gid} started. Current player: {gs.current_player}")
    return _to_dto(gid, gs)

@router.post("/{game_id}/move", response_model=GameStateDTO)
def make_move(game_id: str, payload: MoveRequest) -> GameStateDTO:
    if game_id not in GAMES:
        raise HTTPException(status_code=404, detail="Game not found.")

    gs = GAMES[game_id][-1]

    if gs.winner or gs.is_draw:
        raise HTTPException(status_code=400, detail="Game is already over.")

    try:
        new_state = move(gs, payload.index)
        placed_symbol = gs.current_player  # capture the symbol that was just placed
    except (IndexError, ValueError) as e:
        raise HTTPException(status_code=400, detail=str(e))

    GAMES[game_id].append(new_state)

    print(f"[MOVE] Game {game_id}, move at {payload.index}, placed: {placed_symbol}. New current player: {new_state.current_player}")

    return _to_dto(game_id, new_state)


@router.post("/{game_id}/reset", response_model=GameStateDTO)
def reset_game(game_id: str) -> GameStateDTO:
    if game_id not in GAMES:
        raise HTTPException(status_code=404, detail="Game not found.")

    gs = new_game()
    gs.current_player = "X"  # always start with X

    GAMES[game_id] = [gs]

    print(f"[RESET] Game {game_id} reset. Current player: {gs.current_player}")

    return _to_dto(game_id, gs)
