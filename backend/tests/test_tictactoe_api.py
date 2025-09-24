from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.tictactoe.router import router

app = FastAPI()
app.include_router(router)
client = TestClient(app)

# ruff: noqa: S101  (pytest asserts are idiomatic in tests)


def test_create_and_get_game():
    r = client.post("/tictactoe/new", json={"starting_player": "O"})
    assert r.status_code == 200
    data = r.json()
    gid = data["id"]
    assert data["current_player"] == "O"
    assert len(data["boards"]) == 9
    assert data["active_board"] is None

    r = client.get(f"/tictactoe/{gid}")
    assert r.status_code == 200
    data2 = r.json()
    assert data2["id"] == gid
    assert len(data2["boards"]) == 9


def test_make_move_and_active_board_rule():
    r = client.post("/tictactoe/new", json={"starting_player": "X"})
    gid = r.json()["id"]

    # First move can be anywhere: play board 0, cell 4
    r = client.post(f"/tictactoe/{gid}/move", json={"board_index": 0, "cell_index": 4})
    assert r.status_code == 200
    data = r.json()
    assert data["boards"][0]["cells"][4] == "X"
    # Next active board must be 4
    assert data["active_board"] == 4

    # Illegal board: try to play on board 0 again -> 400
    r = client.post(f"/tictactoe/{gid}/move", json={"board_index": 0, "cell_index": 0})
    assert r.status_code == 400
    assert "Must play in board 4" in r.json()["detail"]


def test_bad_requests():
    r = client.post("/tictactoe/new", json={})
    gid = r.json()["id"]

    r = client.post(f"/tictactoe/{gid}/move", json={"board_index": 0, "cell_index": 99})
    assert r.status_code == 400
    assert "Cell index must be in range" in r.json()["detail"]

    # occupy board 0 cell 0 then try again
    client.post(f"/tictactoe/{gid}/move", json={"board_index": 0, "cell_index": 0})
    r = client.post(f"/tictactoe/{gid}/move", json={"board_index": 0, "cell_index": 0})
    assert r.status_code == 400
    assert "Cell already occupied" in r.json()["detail"]


def test_mini_board_win_via_api():
    """Test mini-board win through API"""
    r = client.post("/tictactoe/new", json={"starting_player": "X"})
    gid = r.json()["id"]

    # Win board 0: X plays 0,1,2
    client.post(f"/tictactoe/{gid}/move", json={"board_index": 0, "cell_index": 0})
    client.post(f"/tictactoe/{gid}/move", json={"board_index": 0, "cell_index": 3})
    client.post(f"/tictactoe/{gid}/move", json={"board_index": 0, "cell_index": 1})
    client.post(f"/tictactoe/{gid}/move", json={"board_index": 0, "cell_index": 4})
    r = client.post(f"/tictactoe/{gid}/move", json={"board_index": 0, "cell_index": 2})

    data = r.json()
    assert data["boards"][0]["winner"] == "X"
    assert data["boards"][0]["is_draw"] is False
    assert data["active_board"] is None  # Any board now


def test_global_win_via_api():
    """Test global win through API"""
    r = client.post("/tictactoe/new", json={"starting_player": "X"})
    gid = r.json()["id"]

    # Win boards 0, 1, 2 (top row) to win the Super game
    # Board 0: X wins
    client.post(f"/tictactoe/{gid}/move", json={"board_index": 0, "cell_index": 0})
    client.post(f"/tictactoe/{gid}/move", json={"board_index": 0, "cell_index": 3})
    client.post(f"/tictactoe/{gid}/move", json={"board_index": 0, "cell_index": 1})
    client.post(f"/tictactoe/{gid}/move", json={"board_index": 0, "cell_index": 4})
    client.post(f"/tictactoe/{gid}/move", json={"board_index": 0, "cell_index": 2})

    # Board 1: X wins
    client.post(f"/tictactoe/{gid}/move", json={"board_index": 1, "cell_index": 0})
    client.post(f"/tictactoe/{gid}/move", json={"board_index": 1, "cell_index": 3})
    client.post(f"/tictactoe/{gid}/move", json={"board_index": 1, "cell_index": 1})
    client.post(f"/tictactoe/{gid}/move", json={"board_index": 1, "cell_index": 4})
    client.post(f"/tictactoe/{gid}/move", json={"board_index": 1, "cell_index": 2})

    # Board 2: X wins -> Global win!
    r = client.post(f"/tictactoe/{gid}/move", json={"board_index": 2, "cell_index": 0})
    client.post(f"/tictactoe/{gid}/move", json={"board_index": 2, "cell_index": 3})
    client.post(f"/tictactoe/{gid}/move", json={"board_index": 2, "cell_index": 1})
    client.post(f"/tictactoe/{gid}/move", json={"board_index": 2, "cell_index": 4})
    r = client.post(f"/tictactoe/{gid}/move", json={"board_index": 2, "cell_index": 2})

    data = r.json()
    assert data["global_winner"] == "X"
    assert data["is_global_draw"] is False


def test_cannot_move_after_global_win():
    """Test that moves are rejected after global win"""
    r = client.post("/tictactoe/new", json={"starting_player": "X"})
    gid = r.json()["id"]

    # Win boards 0, 1, 2 to achieve global win
    for board in [0, 1, 2]:
        client.post(f"/tictactoe/{gid}/move", json={"board_index": board, "cell_index": 0})
        client.post(f"/tictactoe/{gid}/move", json={"board_index": board, "cell_index": 3})
        client.post(f"/tictactoe/{gid}/move", json={"board_index": board, "cell_index": 1})
        client.post(f"/tictactoe/{gid}/move", json={"board_index": board, "cell_index": 4})
        client.post(f"/tictactoe/{gid}/move", json={"board_index": board, "cell_index": 2})

    # Try to make another move after global win
    r = client.post(f"/tictactoe/{gid}/move", json={"board_index": 3, "cell_index": 0})
    assert r.status_code == 400
    assert "Game is already over" in r.json()["detail"]


def test_delete_game():
    """Test game deletion"""
    r = client.post("/tictactoe/new", json={"starting_player": "X"})
    gid = r.json()["id"]

    # Verify game exists
    r = client.get(f"/tictactoe/{gid}")
    assert r.status_code == 200

    # Delete game
    r = client.delete(f"/tictactoe/{gid}")
    assert r.status_code == 200
    assert r.json()["ok"] is True

    # Verify game is gone
    r = client.get(f"/tictactoe/{gid}")
    assert r.status_code == 404
