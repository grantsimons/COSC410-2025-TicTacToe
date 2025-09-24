from fastapi import FastAPI
from fastapi.testclient import TestClient
from app.tictactoe.router import router

app = FastAPI()
app.include_router(router)
client = TestClient(app)


# ------------------------
# Standard API Tests
# ------------------------

def test_create_and_get_game():
    # Create new game
    r = client.post("/tictactoe/new", json={"starting_player": "O"})
    assert r.status_code == 200
    data = r.json()
    gid = data["id"]
    assert data["current_player"] == "O"

    # Get the same game using GET
    r = client.get(f"/tictactoe/{gid}")
    assert r.status_code == 200
    data2 = r.json()
    assert data2["id"] == gid
    assert data2["board"] == [None]*9
    assert data2["current_player"] == "O"


def test_make_move_and_win_flow():
    r = client.post("/tictactoe/new", json={"starting_player": "X"})
    gid = r.json()["id"]

    # X at 0
    r = client.post(f"/tictactoe/{gid}/move", json={"index": 0, "symbol": "X"})
    assert r.status_code == 200
    # O at 3
    r = client.post(f"/tictactoe/{gid}/move", json={"index": 3, "symbol": "O"})
    assert r.status_code == 200
    # X at 1
    r = client.post(f"/tictactoe/{gid}/move", json={"index": 1, "symbol": "X"})
    assert r.status_code == 200
    # O at 4
    r = client.post(f"/tictactoe/{gid}/move", json={"index": 4, "symbol": "O"})
    assert r.status_code == 200
    # X at 2 -> win
    r = client.post(f"/tictactoe/{gid}/move", json={"index": 2, "symbol": "X"})
    assert r.status_code == 200
    data = r.json()
    assert data["winner"] == "X"
    assert data["status"].startswith("X wins")


def test_bad_requests():
    r = client.post("/tictactoe/new", json={"starting_player": "X"})
    gid = r.json()["id"]

    # Invalid cell index
    r = client.post(f"/tictactoe/{gid}/move", json={"index": 99, "symbol": "X"})
    assert r.status_code == 400
    assert "Index must be in range" in r.json()["detail"]

    # Occupy a cell and try again
    client.post(f"/tictactoe/{gid}/move", json={"index": 0, "symbol": "X"})
    r = client.post(f"/tictactoe/{gid}/move", json={"index": 0, "symbol": "O"})
    assert r.status_code == 400
    assert "Cell already occupied" in r.json()["detail"]
