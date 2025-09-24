import { describe, expect, it, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import TicTacToe from "../components/TicTacToe";
import App from "../App";

// Mock window.location.search
const mockLocation = {
  search: "",
};
Object.defineProperty(window, "location", {
  value: mockLocation,
  writable: true,
});

describe("TicTacToe component (API via MSW)", () => {
  beforeEach(() => {
    mockLocation.search = "";
  });

  it("plays a simple Super Tic-Tac-Toe game", async () => {
    render(<App />);

    // Wait for Super game to load (MSW handles POST /tictactoe/new)
    await screen.findByLabelText("board-0-cell-0");

    // Make a move on board 0, cell 0
    fireEvent.click(screen.getByLabelText("board-0-cell-0"));
    await screen.findByText(/O's turn/i);   // wait until move resolved
    expect(screen.getByLabelText("board-0-cell-0")).toHaveTextContent("X");

    // Make a move on board 0, cell 1 (should be active board now)
    fireEvent.click(screen.getByLabelText("board-0-cell-1"));
    await screen.findByText(/X's turn/i);   // wait until move resolved
    expect(screen.getByLabelText("board-0-cell-1")).toHaveTextContent("O");
  });

  it("prevents moves in occupied cells", async () => {
    render(<App />);
    const cell0 = await screen.findByLabelText("board-0-cell-0");
    fireEvent.click(cell0);
    await screen.findByText(/O's turn/i);   // wait until move resolved
    fireEvent.click(cell0); // second click ignored/disabled
    await screen.findByText(/O's turn/i);   // wait until move resolved
    expect(cell0.textContent).toBe("X");
  });

  it("can start a new game after finishing", async () => {
    render(<App />);
    await screen.findByLabelText("board-0-cell-0");
    
    // Make a few moves
    fireEvent.click(screen.getByLabelText("board-0-cell-0"));
    await screen.findByText(/O's turn/i);   // wait until move resolved
    fireEvent.click(screen.getByLabelText("board-0-cell-1"));
    await screen.findByText(/X's turn/i);   // wait until move resolved

    // Click "New Game" (component calls POST /tictactoe/new again)
    const newGameBtn = screen.getByRole("button", { name: /new game/i });
    fireEvent.click(newGameBtn);

    // board should be reset: cell-0 is empty again
    const cell0 = await screen.findByLabelText("board-0-cell-0");
    expect(cell0.textContent).toBe("");
  });

  it("renders classic mode when ?mode=classic", async () => {
    mockLocation.search = "?mode=classic";
    
    render(<App />);

    expect(await screen.findByText("Super Tic‑Tac‑Toe")).toBeInTheDocument();
    expect(await screen.findByText("Classic")).toBeInTheDocument();
    
    // Should render classic TicTacToe component
    await screen.findByLabelText("cell-0");
  });

  it("shows active board highlighting", async () => {
    render(<App />);
    
    // Wait for game to load
    await screen.findByLabelText("board-0-cell-0");
    
    // Make a move to activate a specific board
    fireEvent.click(screen.getByLabelText("board-0-cell-0"));
    await screen.findByText(/O's turn/i);
    
    // Board 0 should now be the active board
    const board0 = screen.getByLabelText("board-0-cell-0").closest("div")?.parentElement;
    expect(board0).toHaveClass("ring-2", "ring-indigo-400/60");
  });
});
