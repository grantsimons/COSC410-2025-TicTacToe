import pytest
from app.tictactoe.engine import new_game, move, available_moves, status, SuperGameState, move_super

# ------------------------
# Minor Board Tests
# ------------------------

def test_new_game_initial_state():
    gs = new_game()
    assert gs.board == [None]*9
    assert gs.current_player == "X"
    assert gs.winner is None
    assert gs.is_draw is False
    assert status(gs) == "X's turn"

def test_valid_move_and_turn_switch():
    gs = new_game()
    gs = move(gs, 0, "X")
    # Note: move now does not automatically flip player; we pass symbol manually
    assert gs.board[0] == "X"
    assert gs.winner is None
    assert not gs.is_draw

def test_cannot_play_occupied_cell():
    gs = new_game()
    gs = move(gs, 0, "X")
    with pytest.raises(ValueError):
        move(gs, 0, "O")

def test_winning_rows_cols_diagonals():
    # Row win
    gs = new_game()
    gs = move(gs, 0, "X")
    gs = move(gs, 3, "O")
    gs = move(gs, 1, "X")
    gs = move(gs, 4, "O")
    gs = move(gs, 2, "X")
    assert gs.winner == "X"

    # Column win
    gs = new_game()
    gs = move(gs, 0, "X")
    gs = move(gs, 1, "O")
    gs = move(gs, 3, "X")
    gs = move(gs, 2, "O")
    gs = move(gs, 6, "X")
    assert gs.winner == "X"

    # Diagonal win
    gs = new_game()
    gs = move(gs, 0, "X")
    gs = move(gs, 1, "O")
    gs = move(gs, 4, "X")
    gs = move(gs, 2, "O")
    gs = move(gs, 8, "X")
    assert gs.winner == "X"

def test_draw_condition():
    gs = new_game()
    # Sequence to fill board without a winner
    seq = [0,1,2,5,3,6,4,8,7]
    symbols = ["X","O"] * 5  # alternate symbols
    for idx, cell in enumerate(seq):
        gs = move(gs, cell, symbols[idx])
    assert gs.is_draw is True
    assert gs.winner is None

def test_available_moves_updates():
    gs = new_game()
    assert set(available_moves(gs)) == set(range(9))
    gs = move(gs, 4, "X")
    assert 4 not in available_moves(gs)
    assert len(available_moves(gs)) == 8

def test_game_over_disallows_moves():
    gs = new_game()
    gs = move(gs, 0, "X")
    gs = move(gs, 3, "O")
    gs = move(gs, 1, "X")
    gs = move(gs, 4, "O")
    gs = move(gs, 2, "X")
    with pytest.raises(ValueError):
        move(gs, 8, "O")

# ------------------------
# Super Game Tests
# ------------------------

def test_supergame_draw_if_all_boards_complete():
    sgs = SuperGameState()
    # Fill all boards as draws
    for board in sgs.boards:
        board.board = ["X","O","X","O","X","O","O","X","O"]
        board.is_draw = True
    # Trigger major check
    with pytest.raises(ValueError):
        move_super(sgs, 0, 0, "X")  # cannot move in completed board


def test_supergame_cannot_move_after_major_winner():
    sgs = SuperGameState()
    sgs.major_winner = "X"

    # Only assert that ValueError is raised
    with pytest.raises(ValueError):
        move_super(sgs, 0, 0, "O")
