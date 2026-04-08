"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/lib/language-context";
import { BarChart3, CheckCircle2, Vote } from "lucide-react";

interface PollOption {
  text: string;
  textHi?: string;
}

interface Poll {
  id: string;
  question: string;
  questionHi: string;
  options: PollOption[];
  votes: number[];
  totalVotes: number;
  active: boolean;
}

interface PollWidgetProps {
  pollId?: string;
  inline?: boolean;
}

export default function PollWidget({ pollId, inline = false }: PollWidgetProps) {
  const { t } = useLanguage();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchPoll = useCallback(async () => {
    try {
      const url = pollId ? `/api/poll?id=${pollId}` : "/api/poll";
      const res = await fetch(url, { cache: "no-store" });
      const data = await res.json();

      if (pollId && data.poll) {
        setPoll(data.poll);
        // Check localStorage for voted status
        const voted = localStorage.getItem(`poll_voted_${data.poll.id}`);
        if (voted) setHasVoted(true);
      } else if (data.polls?.length > 0) {
        const latestPoll = data.polls[0];
        setPoll(latestPoll);
        const voted = localStorage.getItem(`poll_voted_${latestPoll.id}`);
        if (voted) setHasVoted(true);
      }
    } catch {
      setError("Failed to load poll");
    } finally {
      setLoading(false);
    }
  }, [pollId]);

  useEffect(() => {
    fetchPoll();
  }, [fetchPoll]);

  const handleVote = async () => {
    if (!poll || selectedOption === null || submitting) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/poll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pollId: poll.id, optionIndex: selectedOption }),
      });
      const data = await res.json();

      if (data.success || data.alreadyVoted) {
        setHasVoted(true);
        localStorage.setItem(`poll_voted_${poll.id}`, "true");
        if (data.votes) {
          setPoll((prev) =>
            prev ? { ...prev, votes: data.votes, totalVotes: data.totalVotes } : prev
          );
        } else {
          // If already voted, refetch to get current results
          await fetchPoll();
        }
      } else if (data.error) {
        if (data.alreadyVoted) {
          setHasVoted(true);
          localStorage.setItem(`poll_voted_${poll.id}`, "true");
          await fetchPoll();
        } else {
          setError(data.error);
        }
      }
    } catch {
      setError("Failed to submit vote");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={`${inline ? "" : "border-2 border-black p-4"} bg-white dark:bg-neutral-900`}>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4" />
          <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded" />
          <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded" />
          <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded" />
        </div>
      </div>
    );
  }

  if (!poll) return null;

  const totalVotes = poll.totalVotes || poll.votes?.reduce((a, b) => a + b, 0) || 0;

  return (
    <div
      className={`bg-white dark:bg-neutral-900 ${
        inline ? "py-4" : "border-2 border-black p-5"
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="w-4 h-4 text-red-600" />
        <span className="text-[10px] font-inter font-black uppercase tracking-widest text-red-600">
          {t("Poll", "जनमत")}
        </span>
      </div>

      {/* Question */}
      <h3 className="font-newsreader font-bold text-lg leading-tight mb-4 text-black dark:text-white">
        {t(poll.question, poll.questionHi || poll.question)}
      </h3>

      {/* Options */}
      {!hasVoted ? (
        <div className="space-y-2">
          {poll.options.map((option: PollOption, idx: number) => (
            <label
              key={idx}
              className={`flex items-center gap-3 p-3 border-2 cursor-pointer transition-all duration-200 ${
                selectedOption === idx
                  ? "border-red-600 bg-red-50 dark:bg-red-950"
                  : "border-neutral-300 dark:border-neutral-600 hover:border-neutral-500"
              }`}
            >
              <input
                type="radio"
                name={`poll-${poll.id}`}
                checked={selectedOption === idx}
                onChange={() => setSelectedOption(idx)}
                className="w-4 h-4 accent-red-600"
              />
              <span className="font-inter text-sm text-black dark:text-white">
                {t(option.text, option.textHi || option.text)}
              </span>
            </label>
          ))}

          <button
            onClick={handleVote}
            disabled={selectedOption === null || submitting}
            className="w-full mt-3 py-2.5 bg-black dark:bg-white text-white dark:text-black font-inter font-bold text-sm uppercase tracking-wider border-2 border-black dark:border-white disabled:opacity-40 hover:bg-red-600 hover:border-red-600 hover:text-white transition-colors duration-200"
          >
            {submitting ? t("Submitting...", "भेज रहे हैं...") : t("Vote", "वोट करें")}
          </button>
        </div>
      ) : (
        /* Results View */
        <div className="space-y-3">
          {poll.options.map((option: PollOption, idx: number) => {
            const voteCount = poll.votes?.[idx] || 0;
            const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
            const isSelected = selectedOption === idx;
            const isMax = voteCount === Math.max(...(poll.votes || [0]));

            return (
              <div key={idx} className="relative">
                <div className="flex items-center justify-between mb-1">
                  <span className={`font-inter text-sm ${isMax ? "font-bold" : ""} text-black dark:text-white`}>
                    {t(option.text, option.textHi || option.text)}
                    {isSelected && (
                      <CheckCircle2 className="inline w-3.5 h-3.5 ml-1.5 text-green-600" />
                    )}
                  </span>
                  <span className="font-inter text-sm font-bold tabular-nums text-black dark:text-white">
                    {percentage}%
                  </span>
                </div>
                <div className="w-full h-7 bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-700 ease-out ${
                      isMax
                        ? "bg-red-600"
                        : "bg-neutral-300 dark:bg-neutral-600"
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}

          <div className="flex items-center justify-between pt-2 border-t border-neutral-200 dark:border-neutral-700">
            <span className="font-inter text-xs text-neutral-500">
              <Vote className="inline w-3 h-3 mr-1" />
              {totalVotes.toLocaleString()} {t("votes", "मत")}
            </span>
            <span className="font-inter text-[10px] text-neutral-400 uppercase tracking-wider">
              {t("Thank you for voting!", "धन्यवाद!")}
            </span>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-2 font-inter text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
