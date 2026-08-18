"use client";

import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";

import { addRecentPoll } from "../utils/recentPolls";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  `http://${typeof window !== "undefined" ? window.location.hostname : "localhost"}:3001`;

export function usePollSocket(token) {
  const [isConnected, setIsConnected] = useState(false);
  const [pollId, setPollId] = useState(null);
  const [pollData, setPollData] = useState({
    title: "",
    description: "",
    options: [],
    votes: {},
    detailedVotes: {},
  });
  const [userPreviousVote, setUserPreviousVote] = useState(null);
  const [activeUsers, setActiveUsers] = useState([]);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState(null);

  const socketRef = useRef(null);

  useEffect(() => {
    if (!token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    const socket = io(BACKEND_URL, {
      auth: { token },
      withCredentials: true,
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      setError(null);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("connect_error", (err) => {
      if (err.message && err.message.includes("Authentication")) {
        setError("Session expired. Please login again.");
      } else {
        setError(err.message || "Socket connection error");
      }
    });

    socket.on("poll_created", ({ pollId: newPollId, pollData: data }) => {
      setPollId(newPollId);
      setPollData({
        title: data.title,
        description: data.description,
        options: data.options,
        votes: data.results || {},
        detailedVotes: data.detailedVotes || {},
      });
      addRecentPoll({ pollId: newPollId, title: data.title });
      setError(null);
    });

    socket.on("poll_joined", ({ pollId: joinedId, pollData: data, userPreviousVote: prevVote }) => {
      setPollId(joinedId);
      setPollData({
        title: data.title,
        description: data.description,
        options: data.options,
        votes: data.results || {},
        detailedVotes: data.detailedVotes || {},
      });
      setUserPreviousVote(prevVote || null);
      addRecentPoll({ pollId: joinedId, title: data.title });
      setError(null);
    });

    socket.on("user_joined", ({ username }) => {
      setToast(`${username} joined the poll`);
    });

    socket.on("update_users", (users) => {
      setActiveUsers(users);
    });

    socket.on("update_votes", ({ results, detailedVotes }) => {
      setPollData((prev) => ({
        ...prev,
        votes: results || {},
        detailedVotes: detailedVotes || {},
      }));
    });

    socket.on("error", (errMessage) => {
      setError(typeof errMessage === "string" ? errMessage : "Poll error");
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  const createPoll = (title, description, options) => {
    if (socketRef.current) {
      socketRef.current.emit("create_poll", { title, description, options });
    }
  };

  const joinPoll = (id) => {
    if (socketRef.current) {
      socketRef.current.emit("join_poll", id);
    }
  };

  const castVote = (option) => {
    if (socketRef.current) {
      socketRef.current.emit("cast_vote", option);
    }
  };

  const retractVote = () => {
    if (socketRef.current) {
      socketRef.current.emit("retract_vote");
    }
  };

  const leavePoll = () => {
    if (socketRef.current) {
      socketRef.current.emit("leave_poll");
    }
    setPollId(null);
    setUserPreviousVote(null);
  };

  return {
    socket: socketRef.current,
    isConnected,
    pollId,
    pollData,
    userPreviousVote,
    activeUsers,
    toast,
    setToast,
    error,
    setError,
    createPoll,
    joinPoll,
    castVote,
    retractVote,
    leavePoll,
  };
}
