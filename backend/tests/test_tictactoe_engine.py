import pytest

from app.tictactoe.engine import available_moves, move, new_game, status, super_move, super_new_game

# ruff: noqa: S101  (pytest asserts are idiomatic in tests)


def test_new_game_initial_state():
    gs = new_game()
    assert gs.board == [None] * 9
    assert gs.current_player == "X"
    assert gs.winner is None
    assert gs.is_draw is False
    assert status(gs) == "X's turn"


def test_valid_move_and_turn_switch():
    gs = new_game()
    gs = move(gs, 0)
    assert gs.board[0] == "X"
    assert gs.current_player == "O"
    assert gs.winner is None
    assert not gs.is_draw


def test_cannot_play_occupied_cell():
    gs = new_game()
    gs = move(gs, 0)
    with pytest.raises(ValueError):
        move(gs, 0)


def test_winning_rows_cols_diagonals():
    # Row win
    gs = new_game()
    gs = move(gs, 0)  # X
    gs = move(gs, 3)  # O
    gs = move(gs, 1)  # X
    gs = move(gs, 4)  # O
    gs = move(gs, 2)  # X wins
    assert gs.winner == "X"

    # Column win
    gs = new_game()
    gs = move(gs, 0)  # X
    gs = move(gs, 1)  # O
    gs = move(gs, 3)  # X
    gs = move(gs, 2)  # O
    gs = move(gs, 6)  # X wins
    assert gs.winner == "X"

    # Diagonal win
    gs = new_game()
    gs = move(gs, 0)  # X
    gs = move(gs, 1)  # O
    gs = move(gs, 4)  # X
    gs = move(gs, 2)  # O
    gs = move(gs, 8)  # X wins
    assert gs.winner == "X"


def test_draw_condition():
    gs = new_game()
    # X O X
    # X X O
    # O X O
    # sequence crafted to avoid earlier wins
    seq = [0, 1, 2, 5, 3, 6, 4, 8, 7]
    for i in seq:
        gs = move(gs, i)
    assert gs.is_draw is True
    assert gs.winner is None


def test_available_moves_updates():
    gs = new_game()
    assert set(available_moves(gs)) == set(range(9))
    gs = move(gs, 4)
    assert 4 not in available_moves(gs)
    assert len(available_moves(gs)) == 8


def test_game_over_disallows_moves():
    gs = new_game()
    gs = move(gs, 0)  # X
    gs = move(gs, 3)  # O
    gs = move(gs, 1)  # X
    gs = move(gs, 4)  # O
    gs = move(gs, 2)  # X wins
    with pytest.raises(ValueError):
        move(gs, 8)


def test_super_new_game_and_move_flow():
    s = super_new_game()
    assert s["current_player"] == "X"
    assert s["active_board"] is None
    assert len(s["boards"]) == 9

    # First move on board 0, cell 4
    s = super_move(s, 0, 4)
    assert s["boards"][0]["cells"][4] == "X"
    assert s["current_player"] == "O"
    assert s["active_board"] == 4

    # Next move must be on board 4
    s = super_move(s, 4, 0)
    assert s["boards"][4]["cells"][0] == "O"


def test_mini_board_win():
    """Test that a mini-board can be won"""
    s = super_new_game()

    # Win board 0: X plays 0,1,2
    s = super_move(s, 0, 0)  # X on board 0, cell 0
    s = super_move(s, 0, 3)  # O on board 0, cell 3
    s = super_move(s, 0, 1)  # X on board 0, cell 1
    s = super_move(s, 0, 4)  # O on board 0, cell 4
    s = super_move(s, 0, 2)  # X on board 0, cell 2 -> X wins board 0

    assert s["boards"][0]["winner"] == "X"
    assert s["boards"][0]["is_draw"] is False
    assert s["active_board"] is None  # Any board now since board 0 is won


def test_mini_board_draw():
    """Test that a mini-board can be a draw"""
    s = super_new_game()

    # Create a draw on board 0
    moves = [(0, 0), (0, 1), (0, 2), (0, 4), (0, 3), (0, 5), (0, 7), (0, 6), (0, 8)]
    for board_idx, cell_idx in moves:
        s = super_move(s, board_idx, cell_idx)

    assert s["boards"][0]["winner"] is None
    assert s["boards"][0]["is_draw"] is True
    assert s["active_board"] is None  # Any board now since board 0 is drawn


def test_global_win():
    """Test winning the Super game by winning 3 mini-boards in a row"""
    s = super_new_game()

    # Win boards 0, 1, 2 (top row) to win the Super game
    # Board 0: X wins
    s = super_move(s, 0, 0)
    s = super_move(s, 0, 3)
    s = super_move(s, 0, 1)
    s = super_move(s, 0, 4)
    s = super_move(s, 0, 2)

    # Board 1: X wins
    s = super_move(s, 1, 0)
    s = super_move(s, 1, 3)
    s = super_move(s, 1, 1)
    s = super_move(s, 1, 4)
    s = super_move(s, 1, 2)

    # Board 2: X wins -> Global win!
    s = super_move(s, 2, 0)
    s = super_move(s, 2, 3)
    s = super_move(s, 2, 1)
    s = super_move(s, 2, 4)
    s = super_move(s, 2, 2)

    assert s["global_winner"] == "X"
    assert s["is_global_draw"] is False


def test_global_draw():
    """Test global draw when all boards are closed"""
    s = super_new_game()

    # Fill all boards with draws (simplified - just mark them as draws)
    for board_idx in range(9):
        s["boards"][board_idx]["is_draw"] = True

    # Check global draw detection
    from app.tictactoe.engine import _all_boards_closed_dict, _check_global_winner_dict

    assert _all_boards_closed_dict(s) is True
    assert _check_global_winner_dict(s) is None


def test_free_choice_when_target_closed():
    """Test that when target board is closed, player can choose any open board"""
    s = super_new_game()

    # Close board 4 (make it a draw)
    s["boards"][4]["is_draw"] = True

    # Make a move that would target board 4
    s = super_move(s, 0, 4)  # This should set active_board to 4, but 4 is closed

    # Now player should be able to play on any open board
    s = super_move(s, 1, 0)  # Should work since any board is allowed
    assert s["boards"][1]["cells"][0] == "O"
    assert s["active_board"] == 0  # Next move targets board 0


def test_cannot_play_on_closed_board():
    """Test that moves on closed boards are rejected"""
    s = super_new_game()

    # Close board 0
    s["boards"][0]["winner"] = "X"

    # Try to play on closed board 0
    with pytest.raises(ValueError, match="Selected board is closed"):
        super_move(s, 0, 1)


def test_super_game_over_disallows_moves():
    """Test that moves are disallowed after global win"""
    s = super_new_game()

    # Set global winner
    s["global_winner"] = "X"

    # Try to make a move
    with pytest.raises(ValueError, match="Game is already over"):
        super_move(s, 0, 0)
