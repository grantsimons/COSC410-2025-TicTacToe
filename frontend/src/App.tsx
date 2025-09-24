import React from "react";
import TicTacToe from "@/components/TicTacToe";

type Player = "X" | "O";
type Cell = Player | null;

type SuperMiniBoardDTO = {
  cells: Cell[];
  winner: Player | null;
  is_draw: boolean;
};

type SuperGameStateDTO = {
  id: string;
  boards: SuperMiniBoardDTO[];
  current_player: Player;
  active_board: number | null;
  global_winner: Player | null;
  is_global_draw: boolean;
  status: string;
};

const API_BASE =
  (import.meta as any)?.env?.VITE_API_URL?.replace(/\/$/, "") ??
  "http://localhost:8000";

function SuperTicTacToe() {
  const [state, setState] = React.useState<SuperGameStateDTO | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let canceled = false;
    async function start() {
      setError(null);
      setLoading(true);
      try {
        const r = await fetch(`${API_BASE}/tictactoe/new`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ starting_player: "X" }),
        });
        if (!r.ok) throw new Error(`Create failed: ${r.status}`);
        const gs = (await r.json()) as SuperGameStateDTO;
        if (!canceled) setState(gs);
      } catch (e: any) {
        if (!canceled) setError(e?.message ?? "Failed to start game");
      } finally {
        if (!canceled) setLoading(false);
      }
    }
    start();
    return () => {
      canceled = true;
    };
  }, []);

  async function playMove(board_index: number, cell_index: number) {
    if (!state) return;
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`${API_BASE}/tictactoe/${state.id}/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ board_index, cell_index }),
      });
      if (!r.ok) {
        const detail = await r.json().catch(() => ({}));
        throw new Error(detail?.detail ?? `Move failed: ${r.status}`);
      }
      const next = (await r.json()) as SuperGameStateDTO;
      setState(next);
    } catch (e: any) {
      setError(e?.message ?? "Move failed");
    } finally {
      setLoading(false);
    }
  }

  async function reset() {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`${API_BASE}/tictactoe/new`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ starting_player: "X" }),
      });
      if (!r.ok) throw new Error(`Create failed: ${r.status}`);
      const gs = (await r.json()) as SuperGameStateDTO;
      setState(gs);
    } catch (e: any) {
      setError(e?.message ?? "Failed to reset");
    } finally {
      setLoading(false);
    }
  }

  if (error) {
    return (
      <div className="max-w-[640px] mx-auto p-4">
        <div className="mb-2 text-red-600 font-semibold">Error: {error}</div>
        <button className="rounded-2xl px-4 py-2 border" onClick={reset}>
          Retry
        </button>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="max-w-[640px] mx-auto p-4">
        <div className="text-center">Loading…</div>
      </div>
    );
  }

  const s = state;
  const allowedBoards = s.active_board === null
    ? new Set(s.boards.map((b, i) => ({ i, open: !b.winner && !b.is_draw })).filter(x => x.open).map(x => x.i))
    : new Set([s.active_board]);

  return (
    <div className="mx-auto p-6" style={{ maxWidth: 720 }}>
      {/* Global notification */}
      {(s.global_winner || s.is_global_draw) && (
        <div className="mb-4 p-4 border border-emerald-400/40 bg-gradient-to-r from-emerald-500/20 to-emerald-400/10 text-emerald-300 text-center text-xl font-extrabold tracking-wide shadow-lg">
          {s.global_winner ? `${s.global_winner} wins the game!` : "It's a draw!"}
        </div>
      )}
      <div className="text-center mb-4 text-2xl font-bold text-slate-100">{s.status}</div>
      <div className="grid grid-cols-3 gap-5">
        {s.boards.map((b, bi) => {
          const isActive = allowedBoards.has(bi);
          const closed = b.winner !== null || b.is_draw;
          return (
            <div
              key={bi}
              className={`relative overflow-hidden p-1 border shadow-lg transition-colors ${
                isActive
                  ? "border-indigo-400 ring-2 ring-indigo-400/60 ring-offset-2 ring-offset-slate-950 bg-gradient-to-br from-indigo-950/40 to-slate-900"
                  : "border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950"
              }`}
            >
              {/* Winner overlay */}
              {b.winner && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-indigo-600 text-white text-6xl font-extrabold tracking-tight select-none pointer-events-none">{b.winner}</div>
              )}
              {/* Draw overlay */}
              {b.is_draw && !b.winner && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-700 text-white text-lg font-semibold select-none pointer-events-none">Draw</div>
              )}
              <div className="relative z-0 grid grid-cols-3 gap-1">
                {b.cells.map((c, ci) => {
                  const cellEnabled = isActive && !closed && c === null && !s.global_winner && !s.is_global_draw && !loading;
                  return (
                    <button
                      key={ci}
                      className={`aspect-square border text-2xl font-extrabold flex items-center justify-center transition-all duration-150 ${
                        cellEnabled
                          ? "cursor-pointer ring-2 ring-indigo-400/70 ring-offset-2 ring-offset-slate-950 hover:ring-indigo-300 hover:bg-indigo-600 hover:text-white bg-slate-800 border-slate-600 hover:shadow-lg hover:shadow-indigo-900/20"
                          : isActive
                            ? "bg-slate-800 border-slate-700"
                            : "bg-slate-900 border-slate-800"
                      } ${!cellEnabled ? "disabled:opacity-40" : ""}`}
                      onClick={() => playMove(bi, ci)}
                      aria-label={`board-${bi}-cell-${ci}`}
                      disabled={!cellEnabled}
                    >
                      <span className="text-slate-100">{c}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div className="text-center mt-6">
        <button className="px-5 py-2.5 border border-indigo-400/50 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold tracking-wide shadow-md hover:from-indigo-500 hover:to-purple-500 active:scale-[0.99]" onClick={reset} disabled={loading}>
          New Game
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const mode = React.useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("mode");
  }, []);

  // Default to Super; render classic only if mode=classic
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <header className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0">
        <div className="mx-auto px-6 py-4" style={{ maxWidth: 960 }}>
          <div className="flex items-center gap-3">
            <div className="size-3 bg-indigo-500"></div>
            <div className="text-lg font-semibold tracking-wide">Super Tic‑Tac‑Toe</div>
            <div className="ml-auto text-xs text-slate-400">{mode === "classic" ? "Classic" : "Ultimate"}</div>
          </div>
        </div>
      </header>
      <main className="mx-auto px-6 py-8" style={{ maxWidth: 960 }}>
        {mode === "classic" ? (
          <div className="mx-auto" style={{ maxWidth: 480 }}>
            <TicTacToe />
          </div>
        ) : (
          <SuperTicTacToe />
        )}
      </main>
    </div>
  );
}
