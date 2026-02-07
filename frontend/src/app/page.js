"use client";
import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { Bar } from "react-chartjs-2";
import "chart.js/auto";
import { ChevronDown, ChevronUp, X } from "lucide-react";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  `http://${typeof window !== "undefined" ? window.location.hostname : "localhost"}:3001`;

const socket = io(BACKEND_URL, {
  autoConnect: false, // Wait for token
  withCredentials: true,
});

// 1. Login Component
const LoginView = ({ onJoin }) => {
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`${BACKEND_URL}/login`, {
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
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-slate-900 via-purple-950 to-slate-950 flex flex-col items-center justify-center p-4 text-white font-sans">
      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-2xl border border-purple-500/20 p-8 rounded-3xl shadow-2xl animate-fade-in-up">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-black mb-2 text-transparent bg-clip-text bg-linear-to-r from-purple-400 to-pink-300 tracking-tight">
            LIVE POLL
          </h1>
          <p className="text-purple-200 uppercase tracking-[0.2em] text-xs font-semibold opacity-80">
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
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-4 text-white text-center font-bold text-lg focus:outline-none focus:border-purple-500 focus:bg-slate-800 transition-colors placeholder:text-slate-600 focus:placeholder-transparent"
              placeholder="Your Name"
              maxLength={15}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !name.trim()}
            className={`w-full py-4 rounded-xl font-bold bg-linear-to-r from-purple-600 to-pink-600 shadow-lg shadow-purple-900/30 text-white text-lg transition-all ${
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

// Toast Notification Component
const Toast = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-20 right-4 z-50 animate-fade-in-right">
      <div className="bg-slate-800/90 backdrop-blur-md border border-purple-500/30 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3">
        <div className="bg-purple-500/20 p-2 rounded-full">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-purple-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div>
          <p className="font-bold text-sm">New Participant</p>
          <p className="text-xs text-slate-300">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="ml-2 text-slate-500 hover:text-white"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

// 2. Landing Component (Options to Create or Join)
const LandingView = ({ onCreate, onJoinPoll, error, user, onLogout }) => {
  const [joinId, setJoinId] = useState("");

  return (
    <div className="w-full max-w-md transition-all duration-300 animate-fade-in-up px-4">
      <header className="text-center mb-8 md:mb-10">
        <h1 className="text-4xl md:text-6xl font-black mb-3 text-transparent bg-clip-text bg-linear-to-r from-purple-400 to-pink-300 drop-shadow-sm tracking-tight">
          LIVE POLL
        </h1>
        <div className="flex flex-col items-center gap-2">
          <p className="text-purple-200 uppercase tracking-[0.2em] text-[10px] md:text-xs font-semibold opacity-80">
            Welcome,{" "}
            <span className="text-white font-bold">{user?.username}</span>
          </p>
          <button
            onClick={onLogout}
            className="text-xs text-slate-500 hover:text-slate-300 underline"
          >
            Switch Account
          </button>
        </div>
      </header>

      <div className={`grid grid-cols-1 gap-6 md:gap-8 items-start`}>
        {/* Main Action Section (Center/Right) */}
        <div className={`w-full max-w-md mx-auto space-y-6`}>
          {/* Create Section */}
          <div className="bg-slate-900/80 backdrop-blur-2xl border border-purple-500/20 p-6 md:p-8 rounded-4xl hover:border-purple-500/40 transition-all shadow-xl shadow-black/20 group">
            <button
              onClick={onCreate}
              className="w-full py-4 rounded-2xl font-bold bg-linear-to-r from-purple-600 to-pink-600 shadow-lg shadow-purple-900/30 group-hover:shadow-purple-900/50 hover:scale-[1.02] active:scale-[0.98] transition-all text-white text-lg flex items-center justify-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              Create New Poll
            </button>
            <p className="mt-4 text-slate-400 text-xs font-medium text-center">
              Start a new session as host
            </p>
          </div>

          <div className="relative flex items-center justify-center py-2">
            <div className="h-px bg-slate-800 w-full absolute"></div>
            <span className="bg-slate-950 px-4 text-slate-500 text-xs z-10 font-bold uppercase tracking-widest">
              OR
            </span>
          </div>

          {/* Join Section */}
          <div className="bg-slate-900/80 backdrop-blur-2xl border border-slate-700/50 p-6 md:p-8 rounded-4xl shadow-lg shadow-black/20">
            {error && (
              <div className="mb-5 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center justify-center gap-2 animate-fade-in">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 shrink-0"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {error}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-slate-500 text-lg font-mono">#</span>
                </div>
                <input
                  value={joinId}
                  onChange={(e) => setJoinId(e.target.value.toUpperCase())}
                  onKeyDown={(e) =>
                    e.key === "Enter" &&
                    joinId.length >= 6 &&
                    onJoinPoll(joinId)
                  }
                  placeholder="ENTER CODE"
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-4 py-4 text-white text-center font-mono tracking-[0.2em] text-lg focus:outline-none focus:border-purple-500 focus:bg-slate-800 transition-colors uppercase placeholder:normal-case placeholder:tracking-normal placeholder:text-slate-600"
                  maxLength={6}
                />
              </div>
              <button
                onClick={() => onJoinPoll(joinId)}
                disabled={joinId.length < 6}
                className={`w-full sm:w-auto px-8 py-4 sm:py-0 rounded-xl font-bold transition-all flex items-center justify-center ${
                  joinId.length >= 6
                    ? "bg-slate-200 text-slate-900 hover:bg-white hover:scale-105 active:scale-95"
                    : "bg-slate-800 text-slate-600 cursor-not-allowed"
                }`}
              >
                JOIN
              </button>
            </div>
            <p className="mt-4 text-slate-500 text-xs text-center">
              Enter the 6-character code
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Active Users Sidebar
const ActiveUsersSidebar = ({ users, currentUser }) => {
  const others = users.filter((u) => u.username !== currentUser?.username);

  return (
    <div className="lg:fixed lg:z-40 lg:top-0 lg:bottom-0 lg:left-0 lg:w-72 lg:border-r border-slate-800/50 p-4 transition-all w-full lg:h-full lg:block flex flex-col bg-slate-900/40 backdrop-blur-2xl lg:bg-slate-900/80 mt-12 lg:mt-0 border-t lg:border-t-0 shadow-none lg:shadow-2xl lg:shadow-black/50 custom-scrollbar">
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .custom-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      <h3 className="text-sm lg:text-lg font-bold text-white mb-3 lg:mb-6 flex items-center justify-between sticky top-0 bg-transparent py-2 z-10">
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          Active Users
        </span>
        <span className="text-xs font-bold text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700/50">
          {users.length}
        </span>
      </h3>

      <div className="flex flex-col h-full overflow-y-auto custom-scrollbar pb-20">
        {/* Current User (Row Layout) */}
        {currentUser && (
          <div className="mb-6">
            <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2 pl-1">
              You
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 bg-purple-500/10 border-purple-500/40 shadow-[0_0_20px_rgba(168,85,247,0.15)]">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-linear-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold text-white uppercase shadow-lg ring-2 ring-black/20">
                  {currentUser.username.charAt(0)}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-900 text-[9px] font-bold px-1.5 rounded-full border border-slate-900 shadow-sm leading-tight">
                  ME
                </div>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold truncate text-white">
                  {currentUser.username}
                </span>
                <span className="text-[10px] text-slate-500 font-medium tracking-wide">
                  Host / You
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Other Users (Grid Layout) */}
        {others.length > 0 && (
          <div>
            <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2 pl-1">
              Others
            </div>
            <div className="grid grid-cols-3 gap-2">
              {others.map((u, idx) => (
                <div
                  key={idx}
                  className="flex flex-col items-center p-2 rounded-xl border border-slate-700/30 bg-slate-800/40 hover:bg-slate-800/60 transition-all group"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white uppercase mb-1 ring-2 ring-slate-800 group-hover:ring-slate-700 transition-all">
                    {u.username.charAt(0)}
                  </div>
                  <span className="text-[10px] font-medium text-slate-400 group-hover:text-slate-200 truncate w-full text-center">
                    {u.username}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const VoterDetailsSidebar = ({ option, voters, onClose }) => {
  if (!option) return null;
  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      ></div>
      <div className="fixed z-50 bg-slate-900 border-l border-slate-700/50 p-6 transition-all duration-300 shadow-2xl flex flex-col right-0 top-0 bottom-0 w-80 md:w-96 translate-x-0 animate-fade-in-right rounded-l-3xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white pr-4 leading-tight">
            Voters for "{option}"
          </h3>
          <button
            onClick={onClose}
            className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors text-slate-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {voters && voters.length > 0 ? (
            <div className="space-y-3">
              {voters.map((v, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/30"
                >
                  <div className="w-8 h-8 rounded-full bg-linear-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white uppercase shadow-sm">
                    {v.charAt(0)}
                  </div>
                  <span className="text-slate-200 font-medium text-sm">
                    {v}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-slate-500">
              <p>No votes yet for this option.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

const VoteCard = ({
  option,
  votes,
  totalVotes,
  isSelected,
  onVote,
  voters,
}) => {
  const percentage = totalVotes ? (votes / totalVotes) * 100 : 0;

  return (
    <button
      onClick={onVote}
      className={`
      relative w-full rounded-2xl transition-all duration-300 overflow-hidden border-2 text-left group
      ${
        isSelected
          ? "bg-purple-900/40 border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.2)] scale-[1.02]"
          : "bg-slate-800/40 border-slate-700/50 hover:border-slate-600 hover:scale-[1.01]"
      }
    `}
    >
      {/* Background Progress Bar */}
      <div
        className={`absolute inset-0 bg-purple-500/10 transition-all duration-1000 ease-out origin-left`}
        style={{ width: `${percentage}%` }}
      ></div>

      <div className="relative z-10 p-4">
        {/* Header: Option */}
        <div className="flex justify-between items-start gap-4 mb-3">
          <span className="font-bold text-lg md:text-xl text-white leading-tight wrap-break-word flex-1">
            {option}
          </span>
          {isSelected && (
            <span className="shrink-0 text-[10px] font-bold bg-green-500/20 text-green-300 border border-green-500/30 px-2 py-1 rounded-full uppercase tracking-wider animate-fade-in">
              Selected
            </span>
          )}
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl font-black text-purple-300">
            {Math.round(percentage)}%
          </span>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-900/50 px-2 py-1 rounded-md border border-slate-700/50">
            {votes} Votes
          </span>
        </div>

        {/* Facepile (Visual Only) */}
        {voters.length > 0 && (
          <div className="flex -space-x-2 overflow-hidden pt-2 border-t border-white/5">
            {voters.slice(0, 5).map((v, idx) => (
              <div
                key={idx}
                className="h-6 w-6 rounded-full ring-2 ring-slate-900 bg-slate-700 flex items-center justify-center text-[8px] font-bold text-white"
                title={v}
              >
                {v.charAt(0)}
              </div>
            ))}
            {voters.length > 5 && (
              <div className="h-6 w-6 rounded-full ring-2 ring-slate-900 bg-slate-800 flex items-center justify-center text-[8px] font-bold text-slate-400">
                +{voters.length - 5}
              </div>
            )}
          </div>
        )}
      </div>
    </button>
  );
};
export default function PollPage() {
  const [user, setUser] = useState(null); // { token, username, userId }
  const [view, setView] = useState("LOGIN"); // LOGIN, LANDING, CREATE, POLL
  const [pollId, setPollId] = useState(null);
  const [pollData, setPollData] = useState({
    title: "",
    description: "",
    options: [],
    votes: {},
  });
  const [selectedOption, setSelectedOption] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [toast, setToast] = useState(null); // { message }
  const [activeUsers, setActiveUsers] = useState([]);
  const [viewDetailsOption, setViewDetailsOption] = useState(null);
  const chartRef = React.useRef(null);

  // Poll Creation Form State
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newOptions, setNewOptions] = useState(["", ""]);
  const [error, setError] = useState(null);

  // Debounce Ref
  const debouncedVoteRef = React.useRef(null);

  // Initialize Auth on Mount
  useEffect(() => {
    const storedToken = localStorage.getItem("poll_token");
    const storedUser = localStorage.getItem("poll_user_data");

    if (storedToken && storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      connectSocket(storedToken);
      // Immediately show Landing/Join if we have a user
      setView("LANDING");
    } else {
      setView("LOGIN");
    }
  }, []);

  const connectSocket = (token) => {
    socket.auth = { token };
    socket.connect();
  };

  const handleLogin = (userData) => {
    // Save to storage
    localStorage.setItem("poll_token", userData.token);
    localStorage.setItem("poll_user_data", JSON.stringify(userData));

    setUser(userData);
    connectSocket(userData.token);
    setView("LANDING");
  };

  const handleLogout = () => {
    socket.disconnect();
    localStorage.removeItem("poll_token");
    localStorage.removeItem("poll_user_data");
    setUser(null);
    setView("LOGIN");
    setPollId(null);
  };

  useEffect(() => {
    // Listen for room entry events
    socket.on("connect_error", (err) => {
      console.log("Connection Error:", err.message);
      if (err.message.includes("Authentication")) {
        // Invalid token (expired or server restart)
        handleLogout();
        setError("Session expired. Please login again.");
      }
    });

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    socket.on("poll_created", ({ pollId, pollData }) => {
      console.log("Poll created event received:", pollId);
      setPollId(pollId);
      setPollData({
        title: pollData.title,
        description: pollData.description,
        options: pollData.options,
        votes: pollData.results,
      });
      setView("POLL");
      setShowCreateForm(false);
      setError(null);
    });

    socket.on("poll_joined", ({ pollId, pollData, userPreviousVote }) => {
      setPollId(pollId);
      setPollData({
        title: pollData.title,
        description: pollData.description,
        options: pollData.options,
        votes: pollData.results,
        detailedVotes: pollData.detailedVotes || {},
      });
      setSelectedOption(userPreviousVote);
      setView("POLL");
      setError(null);
    });

    // Notify when new user joins
    socket.on("user_joined", ({ username }) => {
      console.log("User joined notification:", username);
      setToast(`${username} joined the poll`);
    });

    socket.on("update_users", (users) => {
      setActiveUsers(users);
    });

    socket.on("update_votes", ({ results, detailedVotes }) => {
      setPollData((prev) => ({
        ...prev,
        votes: results,
        detailedVotes: detailedVotes,
      }));
    });

    socket.on("error", (msg) => {
      console.log("Socket error received:", msg);
      setError(msg);
    });

    return () => {
      socket.off("connect_error");
      socket.off("connect");
      socket.off("disconnect");
      socket.off("poll_created");
      socket.off("poll_joined");
      socket.off("user_joined");
      socket.off("update_users");
      socket.off("update_votes");
      socket.off("error");
    };
  }, []);

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    setError(null);
    const validOpts = newOptions.filter((o) => o.trim());

    // Check for duplicates
    const uniqueOpts = new Set(validOpts);
    if (uniqueOpts.size !== validOpts.length) {
      setError("Poll options must be unique");
      return;
    }

    if (newTitle && newDesc && validOpts.length >= 2) {
      socket.emit("create_poll", {
        title: newTitle,
        description: newDesc,
        options: validOpts,
      });
    }
  };

  const handleJoinPoll = (id) => {
    if (id) socket.emit("join_poll", id);
  };

  const handleVoteClick = (option) => {
    // 1. Optimistic UI Update
    const isRetracting = selectedOption === option;
    const newSelection = isRetracting ? null : option;
    setSelectedOption(newSelection);

    // 2. Debounce Server Call
    if (debouncedVoteRef.current) {
      clearTimeout(debouncedVoteRef.current);
    }

    debouncedVoteRef.current = setTimeout(() => {
      if (isRetracting) {
        socket.emit("retract_vote");
      } else {
        socket.emit("cast_vote", option);
      }
    }, 500); // 500ms debounce
  };

  // Helper for Create Form
  const handleAddOption = () => setNewOptions([...newOptions, ""]);
  const handleOptionChange = (i, v) => {
    const copy = [...newOptions];
    copy[i] = v;
    setNewOptions(copy);
    if (error) setError(null);
  };
  const handleRemoveOption = (i) =>
    setNewOptions(newOptions.filter((_, idx) => idx !== i));
  const isFormValid =
    newTitle.trim() &&
    newDesc.trim() &&
    newOptions.filter((o) => o.trim()).length >= 2;

  // Render Views
  if (view === "LOGIN") {
    return <LoginView onJoin={handleLogin} />;
  }

  if (view === "LANDING") {
    return (
      <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-slate-900 via-purple-950 to-slate-950 text-white p-4 md:p-6 flex flex-col items-center justify-center font-sans overflow-y-auto relative">
        {toast && <Toast message={toast} onClose={() => setToast(null)} />}
        {showCreateForm ? (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-100 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-purple-500/30 p-6 md:p-8 rounded-3xl w-full max-w-lg shadow-[0_0_50px_rgba(168,85,247,0.2)] overflow-y-auto max-h-[90vh]">
              <h2 className="text-2xl md:text-3xl font-bold bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-6">
                Create New Poll
              </h2>

              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2 animate-fade-in">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {error}
                </div>
              )}

              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div>
                  <label className="block text-slate-400 text-xs md:text-sm mb-1 uppercase tracking-wider">
                    Title
                  </label>
                  <input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 text-sm md:text-base"
                    placeholder="Poll Title"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs md:text-sm mb-1 uppercase tracking-wider">
                    Description
                  </label>
                  <input
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 text-sm md:text-base"
                    placeholder="Description"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs md:text-sm mb-2 uppercase tracking-wider">
                    Options
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {newOptions.map((opt, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input
                          value={opt}
                          onChange={(e) =>
                            handleOptionChange(idx, e.target.value)
                          }
                          className="flex-1 bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 text-sm md:text-base"
                          placeholder={`Option ${idx + 1}`}
                        />
                        {newOptions.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveOption(idx)}
                            className="text-red-400 hover:text-red-300 px-2 text-lg"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="mt-3 text-xs md:text-sm text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1"
                  >
                    + Add Option
                  </button>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setError(null);
                    }}
                    className="flex-1 px-6 py-3 rounded-xl font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm md:text-base"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!isFormValid}
                    className={`flex-1 px-6 py-3 rounded-xl font-bold transition-all text-sm md:text-base ${isFormValid ? "bg-linear-to-r from-purple-600 to-pink-600 shadow-lg" : "bg-slate-800 text-slate-500 cursor-not-allowed"}`}
                  >
                    Launch
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <LandingView
            onCreate={() => {
              setShowCreateForm(true);
              setError(null);
            }}
            onJoinPoll={handleJoinPoll}
            error={error}
            user={user}
            onLogout={handleLogout}
          />
        )}
      </main>
    );
  }

  // POLL VIEW
  const data = {
    labels: Object.keys(pollData.votes || {}),
    datasets: [
      {
        label: "Votes",
        data: Object.values(pollData.votes || {}),
        backgroundColor: Object.keys(pollData.votes || {}).map((key) =>
          key === selectedOption ? "#a855f7" : "rgba(75, 85, 99, 0.6)",
        ),
        borderColor: Object.keys(pollData.votes || {}).map((key) =>
          key === selectedOption ? "#d8b4fe" : "transparent",
        ),
        borderWidth: 2,
        borderRadius: 12,
        hoverBackgroundColor: "#c084fc",
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: (event, elements) => {
      if (elements && elements.length > 0) {
        const index = elements[0].index;
        const option = data.labels[index];
        setViewDetailsOption(option);
      }
    },
    onHover: (event, chartElement) => {
      event.native.target.style.cursor = chartElement[0]
        ? "pointer"
        : "default";
    },
    animation: {
      duration: 500,
      easing: "easeOutQuart",
    },
    layout: {
      padding: { top: 20, bottom: 0 },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          display: true,
          color: "rgba(255, 255, 255, 0.05)",
          drawBorder: false,
        },
        ticks: { display: false },
        border: { display: false },
      },
      x: {
        grid: { display: false, drawBorder: false },
        ticks: {
          color: "#9ca3af",
          font: { weight: "600", size: 11 },
          padding: 10,
        },
        border: { display: false },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.9)",
        titleColor: "#e2e8f0",
        bodyColor: "#cbd5e1",
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
      },
    },
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-slate-900 via-purple-950 to-slate-950 text-white p-4 sm:p-8 flex flex-col items-center justify-center font-sans selection:bg-purple-500 selection:text-white relative overflow-x-hidden lg:pl-64 pb-12 lg:pb-0">
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      <button
        onClick={() => {
          setView("LANDING");
          socket.emit("leave_poll");
        }}
        className="absolute top-4 left-4 md:top-6 md:left-6 text-slate-400 hover:text-white transition-colors flex items-center gap-2 text-sm md:text-base"
      >
        ← Back
      </button>

      <button
        onClick={() => {
          // Fallback Copy Logic
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard
              .writeText(pollId)
              .then(() => setToast("Poll ID copied!"))
              .catch(() => setToast("Failed to copy ID"));
          } else {
            // Fallback for non-secure contexts (http)
            const textArea = document.createElement("textarea");
            textArea.value = pollId;
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
              document.execCommand("copy");
              setToast("Poll ID copied!");
            } catch (err) {
              setToast("Failed to copy ID");
            }
            document.body.removeChild(textArea);
          }
        }}
        className="absolute top-4 right-4 md:top-6 md:right-6 bg-slate-800/80 hover:bg-slate-700 px-3 py-1.5 md:px-4 md:py-2 rounded-full border border-purple-500/30 flex items-center gap-2 backdrop-blur-md transition-all group active:scale-95"
      >
        <span className="text-[10px] md:text-xs text-slate-400 uppercase tracking-wider group-hover:text-slate-300">
          Poll ID:
        </span>
        <span className="font-mono font-bold text-sm md:text-base text-purple-300 group-hover:text-purple-200">
          {pollId}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 text-slate-500 group-hover:text-white ml-1 transition-colors"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
      </button>

      <div className="w-full max-w-4xl flex flex-col items-center animate-fade-in-up pt-12 md:pt-0">
        <header className="text-center mb-6 md:mb-8 relative px-4">
          <h1 className="relative text-3xl md:text-5xl lg:text-6xl font-black mb-3 text-transparent bg-clip-text bg-linear-to-r from-purple-400 to-pink-300 tracking-tight wrap-break-word max-w-3xl">
            {pollData.title}
          </h1>
          <p className="relative text-purple-200 uppercase tracking-[0.2em] text-[10px] md:text-xs lg:text-sm font-semibold opacity-80 wrap-break-word max-w-2xl">
            {pollData.description}
          </p>
        </header>

        <div className="w-full bg-slate-900/80 backdrop-blur-2xl border border-slate-700/50 p-4 md:p-6 rounded-3xl shadow-2xl mb-8 md:mb-12 h-64 md:h-80 relative overflow-hidden group">
          <div className="absolute inset-0 bg-linear-to-br from-purple-500/5 to-transparent pointer-events-none"></div>
          <Bar ref={chartRef} data={data} options={chartOptions} />
          <div className="absolute top-4 right-4 text-[10px] text-slate-500 uppercase tracking-widest hidden md:block">
            Click bar for details
          </div>
        </div>

        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6 px-2">
          {pollData.options.map((option) => (
            <VoteCard
              key={option}
              option={option}
              votes={pollData.votes?.[option] || 0}
              totalVotes={Object.values(pollData.votes || {}).reduce(
                (a, b) => a + b,
                0,
              )}
              isSelected={selectedOption === option}
              onVote={() => handleVoteClick(option)}
              voters={pollData.detailedVotes?.[option] || []}
            />
          ))}
        </div>

        {/* Render Active Users here on mobile (flow layout) */}
        <div className="w-full lg:hidden">
          <ActiveUsersSidebar users={activeUsers} currentUser={user} />
        </div>

        {/* Render Active Users fixed on desktop */}
        <div className="hidden lg:block">
          <ActiveUsersSidebar users={activeUsers} currentUser={user} />
        </div>

        <VoterDetailsSidebar
          option={viewDetailsOption}
          voters={pollData.detailedVotes?.[viewDetailsOption]}
          onClose={() => setViewDetailsOption(null)}
        />

        <footer className="mt-12 md:mt-16 text-slate-500 text-[10px] md:text-xs text-center">
          {Object.values(pollData.votes || {}).reduce((a, b) => a + b, 0)} Total
          Votes
        </footer>
      </div>
    </main>
  );
}
