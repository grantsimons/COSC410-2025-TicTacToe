import "@testing-library/jest-dom";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

// Precomputed fixtures (no logic here, just snapshots)
const initial = {
  id: "TEST-1",
  boards: Array.from({ length: 9 }, () => ({
    cells: Array(9).fill(null),
    winner: null,
    is_draw: false,
  })),
  current_player: "X",
  active_board: null,
  global_winner: null,
  is_global_draw: false,
  status: "X's turn — any board",
};

// Sequence used by your test: board 0, cell 0 → board 0, cell 1 → etc.
const script = [
  // after X plays board 0, cell 0
  {
    boards: Array.from({ length: 9 }, (_, i) => ({
      cells: i === 0 ? ["X", ...Array(8).fill(null)] : Array(9).fill(null),
      winner: null,
      is_draw: false,
    })),
    current_player: "O",
    active_board: 0,
    global_winner: null,
    is_global_draw: false,
    status: "O's turn — board 0",
  },
  // after O plays board 0, cell 1
  {
    boards: Array.from({ length: 9 }, (_, i) => ({
      cells: i === 0 ? ["X", "O", ...Array(7).fill(null)] : Array(9).fill(null),
      winner: null,
      is_draw: false,
    })),
    current_player: "X",
    active_board: 1,
    global_winner: null,
    is_global_draw: false,
    status: "X's turn — board 1",
  },
];

let step = -1;

export const server = setupServer(
  // Create game - always return Super format since both components use same endpoint
  http.post("http://localhost:8000/tictactoe/new", async () => {
    step = -1;
    return HttpResponse.json(initial);
  }),

  // Make move (Super Tic-Tac-Toe)
  http.post("http://localhost:8000/tictactoe/:id/move", async ({ request }) => {
    const body = await request.json();
    
    // Check if this is a classic move (has 'index' property)
    if ('index' in body) {
      // Handle classic Tic-Tac-Toe moves
      const { index } = body;
      const expected = [0, 3, 1, 4, 2][step + 1]; // expected sequence
      if (index !== expected) {
        return HttpResponse.json(
          { detail: `Unexpected move: got ${index}, expected ${expected}` },
          { status: 400 }
        );
      }
      step += 1;
      const classicScript = [
        { board: ["X",null,null, null,null,null, null,null,null], current_player: "O", winner: null, is_draw: false, status: "O's turn" },
        { board: ["X",null,null, "O",null,null, null,null,null], current_player: "X", winner: null, is_draw: false, status: "X's turn" },
        { board: ["X","X",null, "O",null,null, null,null,null], current_player: "O", winner: null, is_draw: false, status: "O's turn" },
        { board: ["X","X",null, "O","O",null, null,null,null], current_player: "X", winner: null, is_draw: false, status: "X's turn" },
        { board: ["X","X","X", "O","O",null, null,null,null], current_player: "X", winner: "X", is_draw: false, status: "X wins" },
      ];
      const s = classicScript[step];
      return HttpResponse.json({ id: "TEST-1", ...s });
    }
    
    // Handle Super Tic-Tac-Toe moves
    const { board_index, cell_index } = body;
    const expectedMoves = [
      { board_index: 0, cell_index: 0 },
      { board_index: 0, cell_index: 1 },
    ];
    const expected = expectedMoves[step + 1];
    if (!expected || board_index !== expected.board_index || cell_index !== expected.cell_index) {
      return HttpResponse.json(
        { detail: `Unexpected move: got board ${board_index}, cell ${cell_index}` },
        { status: 400 }
      );
    }
    step += 1;
    const s = script[step];
    return HttpResponse.json({
      id: "TEST-1",
      ...s,
    });
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
