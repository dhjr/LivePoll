"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { usePollSocket } from "../hooks/usePollSocket";
import LoginView from "./components/LoginView";
import Toast from "./components/Toast";
import LandingView from "./components/LandingView";
import CreatePollModal from "./components/CreatePollModal";

export default function PollPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [view, setView] = useState("LOGIN"); // LOGIN, LANDING
  const [showCreateForm, setShowCreateForm] = useState(false);

  const {
    pollId,
    toast,
    setToast,
    error,
    setError,
    createPoll,
    joinPoll,
  } = usePollSocket(token);

  useEffect(() => {
    const storedToken = localStorage.getItem("poll_token");
    const storedUser = localStorage.getItem("poll_user_data");

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        setView("LANDING");
      } catch (e) {
        localStorage.clear();
        setView("LOGIN");
      }
    } else {
      setView("LOGIN");
    }
  }, []);

  useEffect(() => {
    if (pollId) {
      router.push(`/poll/${pollId}`);
    }
  }, [pollId, router]);

  const handleLoginSuccess = (userData) => {
    localStorage.setItem("poll_token", userData.token);
    localStorage.setItem("poll_user_data", JSON.stringify(userData));

    setUser(userData);
    setToken(userData.token);
    setView("LANDING");
  };

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    setToken(null);
    setView("LOGIN");
  };

  const handleCreatePoll = (pollPayload) => {
    const { title, description, options } = pollPayload || {};
    if (title && options) {
      createPoll(title, description, options);
    }
    setShowCreateForm(false);
  };

  const handleJoinPoll = (code) => {
    if (code && code.trim().length >= 6) {
      router.push(`/poll/${code.trim().toUpperCase()}`);
    } else {
      setError("Please enter a valid 6-character poll code");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      {view === "LOGIN" && (
        <LoginView onLogin={handleLoginSuccess} error={error} />
      )}

      {view === "LANDING" && (
        <LandingView
          user={user}
          onCreate={() => setShowCreateForm(true)}
          onJoinPoll={handleJoinPoll}
          onLogout={handleLogout}
          error={error}
        />
      )}

      {showCreateForm && (
        <CreatePollModal
          onSubmit={handleCreatePoll}
          onClose={() => setShowCreateForm(false)}
        />
      )}
    </div>
  );
}
