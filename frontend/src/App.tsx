import TicTacToe from "@/components/TicTacToe";

export default function App() {
  // you’ll eventually lift `status`, `reset`, etc. up here
  const status = "X's turn"; // placeholder for now
  const reset = () => console.log("Reset all boards"); 

  return (
    <div className="max-w-5xl mx-auto p-4">
      {/* Global header */}
      <div className="text-center mb-4">
        <div className="text-2xl font-semibold">{status}</div>
        <button
          className="mt-2 rounded-2xl px-4 py-2 border"
          onClick={reset}
        >
          New Game
        </button>
      </div>

      {/* 3x3 grid of minor boards */}
      <div className="grid grid-cols-3 gap-4">
        <TicTacToe />
        <TicTacToe />
        <TicTacToe />
        <TicTacToe />
        <TicTacToe />
        <TicTacToe />
        <TicTacToe />
        <TicTacToe />
        <TicTacToe />
      </div>
    </div>
  );
}
