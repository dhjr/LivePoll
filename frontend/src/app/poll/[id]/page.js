"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Bar } from "react-chartjs-2";
import "chart.js/auto";

import { usePollSocket } from "../../../hooks/usePollSocket";
import LoginView from "../../components/LoginView";
import Toast from "../../components/Toast";
import VoteCard from "../../components/VoteCard";
import ActiveUsersSidebar from "../../components/ActiveUsersSidebar";
import VoterDetailsSidebar from "../../components/VoterDetailsSidebar";

export default function DynamicPollPage() {
  const params = useParams();
  const router = useRouter();
  const pollIdParam = params?.id ? params.id.toUpperCase() : null;

  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [viewDetailsOption, setViewDetailsOption] = useState(null);

  const {
    isConnected,
    pollId,
    pollData,
    userPreviousVote,
    activeUsers,
    toast,
    setToast,
    error,
    joinPoll,
    castVote,
    retractVote,
    leavePoll,
  } = usePollSocket(token);

  useEffect(() => {
    const storedToken = localStorage.getItem("poll_token");
    const storedUser = localStorage.getItem("poll_user_data");

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.clear();
      }
    }
  }, []);

  useEffect(() => {
    if (isConnected && pollIdParam) {
      joinPoll(pollIdParam);
    }
  }, [isConnected, pollIdParam]);

  useEffect(() => {
    if (userPreviousVote !== null) {
      setSelectedOption(userPreviousVote);
    }
  }, [userPreviousVote]);

  const handleLoginSuccess = async (userData) => {
    localStorage.setItem("poll_token", userData.token);
    localStorage.setItem("poll_user_data", JSON.stringify(userData));
    setUser(userData);
    setToken(userData.token);
  };

  const handleVote = (option) => {
    if (selectedOption === option) {
      retractVote();
      setSelectedOption(null);
    } else {
      castVote(option);
      setSelectedOption(option);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-indigo-300">
            Joining Poll <span className="font-mono text-white">#{pollIdParam}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">Please log in as guest to enter room</p>
        </div>
        <LoginView onLogin={handleLoginSuccess} error={error} />
      </div>
    );
  }

  const totalRoomVotes = Object.values(pollData.votes || {}).reduce((a, b) => a + b, 0);

  const chartData = {
    labels: pollData.options || [],
    datasets: [
      {
        label: "Votes",
        data: (pollData.options || []).map((opt) => pollData.votes[opt] || 0),
        backgroundColor: (pollData.options || []).map((opt) =>
          opt === selectedOption ? "rgba(99, 102, 241, 0.9)" : "rgba(51, 65, 85, 0.8)",
        ),
        borderColor: (pollData.options || []).map((opt) =>
          opt === selectedOption ? "#6366f1" : "#475569",
        ),
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { ticks: { precision: 0, color: "#94a3b8", font: { size: 10 } }, grid: { color: "rgba(255,255,255,0.05)" } },
      x: { ticks: { color: "#94a3b8", font: { size: 11, weight: "bold" } }, grid: { display: false } },
    },
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-2 sm:p-4">
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      <div className="w-full max-w-4xl bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xl relative">
        {/* Header with Floating Active Users Badge */}
        <header className="flex flex-wrap justify-between items-center gap-3 pb-3 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold tracking-widest text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                #{pollId || pollIdParam}
              </span>
              <h1 className="text-lg sm:text-xl font-extrabold text-white leading-tight">
                {pollData.title || "Loading Poll..."}
              </h1>
            </div>
            {pollData.description && (
              <p className="text-slate-400 text-xs mt-0.5">{pollData.description}</p>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {/* Floating Active Users Badge */}
            <ActiveUsersSidebar users={activeUsers} currentUser={user} />

            <button
              onClick={() => {
                leavePoll();
                router.push("/");
              }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-300 transition-colors shrink-0"
            >
              ← Home
            </button>
          </div>
        </header>

        {error && (
          <div className="my-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs text-center">
            {error}
          </div>
        )}

        {/* Main Content Layout */}
        <div className="space-y-3 mt-3">
          {/* Top Live Graph */}
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Live Results
              </h3>
              <span className="text-[11px] text-slate-500 font-medium">
                {totalRoomVotes} Total {totalRoomVotes === 1 ? "Vote" : "Votes"}
              </span>
            </div>
            <div className="h-36 sm:h-40">
              <Bar data={chartData} options={chartOptions} />
            </div>
          </div>

          {/* Compact Options List Below Graph */}
          <div>
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Cast Your Vote
            </h2>
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1 items-center">
              {(pollData.options || []).map((option) => (
                <VoteCard
                  key={option}
                  option={option}
                  count={pollData.votes[option] || 0}
                  totalVotes={totalRoomVotes}
                  isSelected={selectedOption === option}
                  onVote={() => handleVote(option)}
                  voters={pollData.detailedVotes?.[option] || []}
                />
              ))}
            </div>
          </div>
        </div>

        {viewDetailsOption && (
          <VoterDetailsSidebar
            option={viewDetailsOption}
            voters={pollData.detailedVotes?.[viewDetailsOption] || []}
            onClose={() => setViewDetailsOption(null)}
          />
        )}
      </div>
    </div>
  );
}
