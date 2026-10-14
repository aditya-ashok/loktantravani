"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw, Download, Sparkles, Ticket, Flag, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { auth } from "@/lib/firebase";
import { EVENTS } from "@/lib/events";

const ADMIN_KEY_STORAGE = "lv-admin-key";

/** Registration data is personal: the API needs a real admin token, not just the admin page. */
async function adminFetch(url: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  const token = await auth.currentUser?.getIdToken().catch(() => null);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  try {
    const key = sessionStorage.getItem(ADMIN_KEY_STORAGE);
    if (key) headers.set("x-admin-key", key);
  } catch { /* storage unavailable */ }
  return fetch(url, { ...init, headers });
}

type Registration = {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  profession: string;
  organisation: string;
  mode: string;
  question: string;
  questionRefined: string;
  questionTheme: string;
  questionFlagged: boolean;
  registeredAt: string;
};

type Brief = {
  themes: { theme: string; count: number; summary: string }[];
  shortlist: { question: string; askedBy: string; theme: string }[];
  note: string;
};

export default function EventRegistrationsPanel() {
  const [slug, setSlug] = useState(EVENTS[0]?.slug || "");
  const [rows, setRows] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [brief, setBrief] = useState<Brief | null>(null);
  const [briefing, setBriefing] = useState(false);
  const [error, setError] = useState("");
  const [needsAuth, setNeedsAuth] = useState(false);
  const [keyInput, setKeyInput] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminFetch(`/api/admin/event-registrations?event=${encodeURIComponent(slug)}&_t=${Date.now()}`);
      const data = await res.json();
      setNeedsAuth(res.status === 401);
      if (!res.ok) throw new Error(data.error);
      setRows(data.registrations || []);
    } catch (e) {
      setError((e as Error).message || "Failed to load registrations");
    }
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  const makeBrief = async () => {
    setBriefing(true);
    setError("");
    try {
      const res = await adminFetch("/api/admin/event-registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: slug }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setBrief(data.brief);
    } catch (e) {
      setError((e as Error).message || "AI brief failed");
    }
    setBriefing(false);
  };

  const exportCSV = () => {
    const cols: (keyof Registration)[] = ["name", "email", "phone", "city", "profession", "organisation", "mode", "question", "questionRefined", "questionTheme", "questionFlagged", "registeredAt"];
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    link.download = `loktantravani-${slug}-registrations-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const q = search.trim().toLowerCase();
  const filtered = q
    ? rows.filter((r) => [r.name, r.email, r.city, r.question, r.questionTheme].some((v) => String(v || "").toLowerCase().includes(q)))
    : rows;
  const inPerson = rows.filter((r) => r.mode === "in-person").length;
  const withQuestion = rows.filter((r) => r.question).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-newsreader font-black uppercase">Event Registrations</h2>
          <div className="flex items-center gap-2 mt-1">
            <select value={slug} onChange={(e) => { setSlug(e.target.value); setBrief(null); }}
              className="text-[10px] font-inter font-black uppercase tracking-widest border border-black/20 px-2 py-1 bg-transparent">
              {EVENTS.map((e) => <option key={e.slug} value={e.slug}>{e.title.en} — {e.guest}</option>)}
            </select>
            <a href={EVENTS.find((e) => e.slug === slug)?.path || `/events/${slug}`} target="_blank" rel="noreferrer" className="text-[10px] font-inter font-black uppercase tracking-widest text-primary flex items-center gap-1">
              Public page <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={load} className="px-3 py-2 border-2 border-black text-xs font-inter font-black uppercase tracking-widest hover:bg-black hover:text-white flex items-center gap-2">
            <RefreshCw className={cn("w-3 h-3", loading && "animate-spin")} /> Refresh
          </button>
          <button onClick={makeBrief} disabled={briefing || withQuestion === 0} className="px-3 py-2 bg-primary text-white text-xs font-inter font-black uppercase tracking-widest hover:opacity-90 flex items-center gap-2 disabled:opacity-50">
            {briefing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} AI question brief
          </button>
          <button onClick={exportCSV} disabled={rows.length === 0} className="px-3 py-2 bg-green-600 text-white text-xs font-inter font-black uppercase tracking-widest hover:opacity-90 flex items-center gap-2 disabled:opacity-50">
            <Download className="w-3 h-3" /> Export CSV
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 font-inter">{error}</p>}

      {needsAuth && (
        <div className="bg-white border-2 border-black p-4 space-y-2">
          <p className="text-sm font-inter">
            Registration details are private. Sign in with an approved admin account (set via <code>ADMIN_EMAILS</code>), or enter the admin API key for this browser session.
          </p>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              try { sessionStorage.setItem(ADMIN_KEY_STORAGE, keyInput.trim()); } catch { /* storage unavailable */ }
              setKeyInput("");
              load();
            }}
          >
            <input type="password" value={keyInput} onChange={(e) => setKeyInput(e.target.value)} placeholder="ADMIN_API_KEY" autoComplete="off"
              className="flex-1 border-2 border-black px-3 py-2 text-sm font-inter" />
            <button type="submit" disabled={!keyInput.trim()} className="px-3 py-2 bg-black text-white text-xs font-inter font-black uppercase tracking-widest disabled:opacity-50">Unlock</button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          ["Registered", rows.length, ""],
          ["In person", inPerson, "text-blue-600"],
          ["Online", rows.length - inPerson, "text-purple-600"],
          ["Questions", withQuestion, "text-primary"],
        ].map(([labelText, value, cls]) => (
          <div key={labelText as string} className="bg-white border-2 border-black p-4">
            <p className={cn("text-3xl font-newsreader font-black", cls as string)}>{value}</p>
            <p className="text-[9px] font-inter font-black uppercase tracking-widest opacity-40">{labelText}</p>
          </div>
        ))}
      </div>

      {brief && (
        <div className="bg-white border-2 border-black p-5 space-y-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-xs font-inter font-black uppercase tracking-widest flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> AI brief for the show</p>
          {brief.note && <p className="text-sm font-newsreader italic">{brief.note}</p>}
          <div className="flex flex-wrap gap-2">
            {brief.themes?.map((t) => (
              <span key={t.theme} title={t.summary} className="px-2 py-1 text-[10px] font-inter font-black uppercase bg-primary/10 text-primary">
                {t.theme} · {t.count}
              </span>
            ))}
          </div>
          <ol className="list-decimal pl-5 space-y-2 text-sm font-inter">
            {brief.shortlist?.map((s, i) => (
              <li key={i}>
                {s.question} <span className="opacity-40 text-xs">— {s.askedBy} · {s.theme}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, city, question…"
        className="w-full border-2 border-black px-3 py-2 text-sm font-inter bg-white" />

      {loading ? (
        <div className="bg-white border-2 border-black p-12 text-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
          <p className="text-sm font-inter opacity-40">Loading registrations...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border-2 border-black p-12 text-center">
          <Ticket className="w-12 h-12 text-black/10 mx-auto mb-4" />
          <p className="text-lg font-newsreader font-bold italic opacity-40">{q ? "No matching registrations" : "No registrations yet — share the event page!"}</p>
        </div>
      ) : (
        <div className="bg-white border-2 border-black overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-black text-white">
                {["Name", "Contact", "City / Role", "Mode", "Question (AI-filed)", "Date"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-inter font-black uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-black/5 hover:bg-primary/5 align-top">
                  <td className="px-4 py-3 text-sm font-inter font-bold">{r.name}{r.organisation && <div className="text-[10px] font-normal opacity-50">{r.organisation}</div>}</td>
                  <td className="px-4 py-3 text-xs font-inter">{r.email}{r.phone && <div className="opacity-50">{r.phone}</div>}</td>
                  <td className="px-4 py-3 text-xs font-inter">{r.city}<div className="opacity-50">{r.profession}</div></td>
                  <td className="px-4 py-3">
                    <span className={cn("px-2 py-1 text-[9px] font-inter font-black uppercase whitespace-nowrap", r.mode === "in-person" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700")}>{r.mode}</span>
                  </td>
                  <td className="px-4 py-3 text-xs font-inter max-w-sm">
                    {r.question ? (
                      <>
                        <p>{r.questionRefined || r.question}</p>
                        <p className="mt-1 flex items-center gap-2 opacity-60">
                          {r.questionTheme && <span className="px-1.5 py-0.5 bg-black/5 text-[9px] font-black uppercase">{r.questionTheme}</span>}
                          {r.questionFlagged && <span className="text-red-600 flex items-center gap-1 text-[9px] font-black uppercase"><Flag className="w-3 h-3" /> Flagged</span>}
                        </p>
                        {r.questionRefined && r.questionRefined !== r.question && <p className="mt-1 opacity-40 italic">Original: {r.question}</p>}
                      </>
                    ) : <span className="opacity-30">—</span>}
                  </td>
                  <td className="px-4 py-3 text-[10px] font-inter opacity-50 whitespace-nowrap">
                    {r.registeredAt ? new Date(r.registeredAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
