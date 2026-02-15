"use client";
import React, { useState } from "react";

const LoginView = ({ onJoin, backendUrl }) => {
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`${backendUrl}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: name }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      onJoin(data); // { token, userId, username }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black flex flex-col items-center justify-center p-4 text-white font-sans">
      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-2xl border border-indigo-500/20 p-8 rounded-3xl shadow-2xl animate-fade-in-up">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-300 tracking-tight">
            LIVE POLL
          </h1>
          <p className="text-indigo-200 uppercase tracking-[0.2em] text-xs font-semibold opacity-80">
            Enter your name to join
          </p>
        </header>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-4 text-white text-center font-bold text-lg focus:outline-none focus:border-indigo-500 focus:bg-slate-800 transition-colors placeholder:text-slate-600 focus:placeholder-transparent"
              placeholder="Your Name"
              maxLength={15}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !name.trim()}
            className={`w-full py-4 rounded-xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 shadow-lg shadow-indigo-900/30 text-white text-lg transition-all ${
              isLoading || !name.trim()
                ? "opacity-50 cursor-not-allowed"
                : "hover:scale-[1.02] active:scale-[0.98]"
            }`}
          >
            {isLoading ? "Joining..." : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginView;
