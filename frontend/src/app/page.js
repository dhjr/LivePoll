"use client";
import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { Bar } from "react-chartjs-2";
import "chart.js/auto";

// Components
import LoginView from "./components/LoginView";
import Toast from "./components/Toast";
import LandingView from "./components/LandingView";
import ActiveUsersSidebar from "./components/ActiveUsersSidebar";
import VoterDetailsSidebar from "./components/VoterDetailsSidebar";
import VoteCard from "./components/VoteCard";
import CreatePollModal from "./components/CreatePollModal";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  `http://${typeof window !== "undefined" ? window.location.hostname : "localhost"}:3001`;

const socket = io(BACKEND_URL, {
  autoConnect: false, // Wait for token
  withCredentials: true,
});

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
  const [error, setError] = useState(null);

  // Debounce Ref
  const debouncedVoteRef = React.useRef(null);

  const connectSocket = (token) => {
    socket.auth = { token };
    socket.connect();
  };

  const handleLogout = () => {
    socket.disconnect();
    localStorage.removeItem("poll_token");
    localStorage.removeItem("poll_user_data");
    setUser(null);
    setView("LOGIN");
    setPollId(null);
  };

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

  const handleLogin = (userData) => {
    // Save to storage
    localStorage.setItem("poll_token", userData.token);
    localStorage.setItem("poll_user_data", JSON.stringify(userData));

    setUser(userData);
    connectSocket(userData.token);
    setView("LANDING");
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

  const handleCreateSubmit = (data) => {
    socket.emit("create_poll", data);
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

  // Render Views
  if (view === "LOGIN") {
    return <LoginView onJoin={handleLogin} backendUrl={BACKEND_URL} />;
  }

  if (view === "LANDING") {
    return (
      <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-white p-4 md:p-6 flex flex-col items-center justify-center font-sans overflow-y-auto relative">
        {toast && <Toast message={toast} onClose={() => setToast(null)} />}

        <CreatePollModal
          isOpen={showCreateForm}
          onClose={() => {
            setShowCreateForm(false);
            setError(null);
          }}
          onSubmit={handleCreateSubmit}
          // Note: Error handling for create is now inside modal or via socket error
        />

        {!showCreateForm && (
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
        backgroundColor: Object.keys(pollData.votes || {}).map(
          (key) =>
            key === selectedOption ? "#6366f1" : "rgba(51, 65, 85, 0.6)", // indigo-500 vs slate-700
        ),
        borderColor: Object.keys(pollData.votes || {}).map(
          (key) => (key === selectedOption ? "#818cf8" : "transparent"), // indigo-400
        ),
        borderWidth: 2,
        borderRadius: 12,
        hoverBackgroundColor: "#818cf8", // indigo-400
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
      easing: "easeOutCubic",
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
        ticks: { display: true },
        border: { display: false },
      },
      x: {
        grid: { display: true, drawBorder: false },
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
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-white p-4 sm:p-8 flex flex-col items-center justify-center font-sans selection:bg-indigo-500 selection:text-white relative overflow-x-hidden lg:pl-64 pb-12 lg:pb-0">
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
        className="absolute top-4 right-4 md:top-6 md:right-6 bg-slate-800/80 hover:bg-slate-700 px-3 py-1.5 md:px-4 md:py-2 rounded-full border border-indigo-500/30 flex items-center gap-2 backdrop-blur-md transition-all group active:scale-95"
      >
        <span className="text-[10px] md:text-xs text-slate-400 uppercase tracking-wider group-hover:text-slate-300">
          Poll ID:
        </span>
        <span className="font-mono font-bold text-sm md:text-base text-indigo-300 group-hover:text-indigo-200">
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
          <h1 className="relative text-3xl md:text-5xl lg:text-6xl font-black mb-3 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-300 tracking-tight wrap-break-word max-w-3xl">
            {pollData.title}
          </h1>
          <p className="relative text-indigo-200 uppercase tracking-[0.2em] text-[10px] md:text-xs lg:text-sm font-semibold opacity-80 wrap-break-word max-w-2xl">
            {pollData.description}
          </p>
        </header>

        <div className="w-full bg-slate-900/80 backdrop-blur-2xl border border-slate-700/50 p-4 md:p-6 rounded-3xl shadow-2xl mb-8 md:mb-12 h-64 md:h-80 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none"></div>
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
