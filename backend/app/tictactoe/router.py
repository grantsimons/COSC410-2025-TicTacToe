from __future__ import annotations

from uuid import uuid4

from fastapi import APIRouter, HTTPException

from .engine import super_move, super_new_game
from .schemas import GameCreate, SuperMoveRequest

router = APIRouter(prefix="/tictactoe", tags=["tictactoe"])

# naive in-memory store; swap for a real cache/DB as needed
SUPER_GAMES: dict[str, dict] = {}


def _serialize(game_id: str, gs: dict) -> dict:
    # inline status to avoid extra imports
    if gs["global_winner"]:
        status = f"{gs['global_winner']} wins"
    elif gs["is_global_draw"]:
        status = "draw"
    elif gs["active_board"] is None:
        status = f"{gs['current_player']}'s turn — any board"
    else:
        status = f"{gs['current_player']}'s turn — board {gs['active_board']}"
    return {
        "id": game_id,
        "boards": [
            {"cells": b["cells"], "winner": b["winner"], "is_draw": b["is_draw"]}
            for b in gs["boards"]
        ],
        "current_player": gs["current_player"],
        "active_board": gs["active_board"],
        "global_winner": gs["global_winner"],
        "is_global_draw": gs["is_global_draw"],
        "status": status,
    }


# no extra helpers; keep router minimal


@router.post("/new")
def create_game(payload: GameCreate) -> dict:
    gs = super_new_game()
    if payload.starting_player in ("X", "O"):
        gs["current_player"] = payload.starting_player  # type: ignore[index]
    else:
        gs["current_player"] = "X"
    gid = str(uuid4())
    SUPER_GAMES[gid] = gs
    return _serialize(gid, gs)


@router.get("/{game_id}")
def get_state(game_id: str) -> dict:
    gs = SUPER_GAMES.get(game_id)
    if not gs:
        raise HTTPException(status_code=404, detail="Game not found.")
    return _serialize(game_id, gs)


# history removed (not required)


@router.post("/{game_id}/move")
def make_move(game_id: str, payload: SuperMoveRequest) -> dict:
    gs = SUPER_GAMES.get(game_id)
    if not gs:
        raise HTTPException(status_code=404, detail="Game not found.")
    try:
        new_state = super_move(gs, payload.board_index, payload.cell_index)
    except (IndexError, ValueError) as e:
        raise HTTPException(status_code=400, detail=str(e))
    SUPER_GAMES[game_id] = new_state
    return _serialize(game_id, new_state)


@router.delete("/{game_id}")
def delete_game(game_id: str) -> dict:
    if game_id in SUPER_GAMES:
        del SUPER_GAMES[game_id]
        return {"ok": True}
    return {"ok": False, "reason": "not found"}


# Removed separate super endpoints; main /tictactoe routes now serve Super Tic-Tac-Toe
