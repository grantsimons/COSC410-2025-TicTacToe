from fastapi import FastAPI
from fastapi.testclient import TestClient
from app.tictactoe.router import router

app = FastAPI()
app.include_router(router)
client = TestClient(app)

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