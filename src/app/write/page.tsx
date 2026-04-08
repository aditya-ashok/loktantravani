"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { PenSquare, CheckCircle, Send, Eye, Sparkles, ArrowRight, User, GraduationCap, Mail, Linkedin, Twitter } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/lib/auth-context";

const GUIDELINES = [
  { icon: "📰", title: "Opinion & Analysis", desc: "Share your perspective on Indian politics, economy, society, or culture." },
  { icon: "📝", title: "800–2000 Words", desc: "Well-structured articles with clear arguments and evidence." },
  { icon: "🚫", title: "No Hate Speech", desc: "Respectful discourse. No communal, casteist, or inflammatory content." },
  { icon: "✅", title: "Original Work", desc: "Must be your own writing. Plagiarism = permanent ban." },
  { icon: "🤖", title: "AI Grammar Assist", desc: "Our AI proofreader helps polish your writing — you keep creative control." },
  { icon: "👁️", title: "Editorial Review", desc: "All submissions reviewed by our editors before publishing." },
];

const CATEGORIES = ["Opinion", "India", "Politics", "Economy", "Tech", "Culture", "Cities", "World", "Defence", "Sports"];

export default function WritePage() {
  const { isLoggedIn, userId, userName, userEmail, userRole, signInWithGoogle } = useAuth();
  const isContributor = userRole === "contributor" || userRole === "author" || userRole === "admin";
  const [registering, setRegistering] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);
  const [form, setForm] = useState({
    name: userName || "",
    education: "",
    age: "",
    gender: "",
    college: "",
    linkedin: "",
    twitter: "",
    bio: "",
  });

  const handleRegister = async () => {
    if (!userId) return;
    setRegistering(true);
    try {
      const res = await fetch("/api/write/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: userId,
          email: userEmail,
          name: form.name || userName,
          education: form.education,
          age: form.age ? parseInt(form.age) : null,
          gender: form.gender,
          college: form.college,
          linkedin: form.linkedin,
          twitter: form.twitter,
          bio: form.bio,
        }),
      });
      const data = await res.json();
      if (data.success) setRegSuccess(true);
    } catch { /* */ }
    setRegistering(false);
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-[180px] md:pt-[220px] pb-24 bg-white dark:bg-[#0a0a0a]">
        {/* Hero */}
        <section className="max-w-5xl mx-auto px-4 md:px-16 mb-16 md:mb-24">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-[10px] font-inter font-black uppercase tracking-[0.3em] text-primary mb-4">✍️ Citizen Journalism</p>
            <h1 className="text-4xl md:text-6xl lg:text-8xl font-newsreader font-black leading-[0.9] tracking-tight mb-6 dark:text-white">
              Write With Us
            </h1>
            <p className="text-lg md:text-xl font-newsreader italic opacity-60 max-w-2xl dark:text-white/60">
              Your voice matters. Share your opinion, analysis, and stories with India&apos;s fastest-growing AI newspaper.
            </p>
            <div className="flex items-center gap-4 mt-4">
              <span className="text-[9px] font-inter font-bold uppercase tracking-widest opacity-40">Published in</span>
              <span className="text-[10px] font-inter font-bold uppercase tracking-widest">LoktantraVani — लोकतंत्रवाणी</span>
            </div>
          </motion.div>
        </section>

        {/* How It Works */}
        <section className="max-w-5xl mx-auto px-4 md:px-16 mb-16 md:mb-24">
          <div className="border-t-4 border-black dark:border-white/20 pt-8">
            <p className="text-[10px] font-inter font-black uppercase tracking-[0.3em] mb-8 dark:text-white">How It Works</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { step: "01", icon: User, title: "Register", desc: "Create your contributor profile with your background and social links." },
                { step: "02", icon: PenSquare, title: "Write", desc: "Draft your article with AI grammar assistance. Submit when ready." },
                { step: "03", icon: CheckCircle, title: "Get Published", desc: "Our editors review with AI validation. Approved? You're live + email notification." },
              ].map((s) => (
                <div key={s.step} className="border-2 border-black dark:border-white/20 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl font-newsreader font-black text-primary">{s.step}</span>
                    <s.icon className="w-6 h-6 opacity-40" />
                  </div>
                  <h3 className="text-xl font-newsreader font-black mb-2 dark:text-white">{s.title}</h3>
                  <p className="text-sm font-inter opacity-60 dark:text-white/60">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Guidelines */}
        <section className="max-w-5xl mx-auto px-4 md:px-16 mb-16 md:mb-24">
          <div className="border-t-2 border-black/20 dark:border-white/10 pt-8">
            <p className="text-[10px] font-inter font-black uppercase tracking-[0.3em] mb-6 dark:text-white">Submission Guidelines</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {GUIDELINES.map((g) => (
                <div key={g.title} className="flex gap-3 p-4 bg-[var(--nyt-light-gray)] dark:bg-white/5">
                  <span className="text-2xl">{g.icon}</span>
                  <div>
                    <p className="text-sm font-inter font-bold dark:text-white">{g.title}</p>
                    <p className="text-xs font-inter opacity-60 dark:text-white/60">{g.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[9px] font-inter uppercase tracking-widest opacity-40 mt-4 dark:text-white/40">
              Accepted categories: {CATEGORIES.join(" • ")}
            </p>
          </div>
        </section>

        {/* CTA / Registration */}
        <section className="max-w-3xl mx-auto px-4 md:px-16 mb-16">
          <div className="border-2 border-black dark:border-white/20 p-6 md:p-10 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]">

            {/* Not logged in */}
            {!isLoggedIn && (
              <div className="text-center">
                <h2 className="text-3xl font-newsreader font-black mb-4 dark:text-white">Ready to Write?</h2>
                <p className="text-sm font-inter opacity-60 mb-6 dark:text-white/60">Sign in with Google to get started.</p>
                <button onClick={signInWithGoogle} className="bg-black text-white px-8 py-4 text-xs font-inter font-black uppercase tracking-widest hover:bg-primary transition-colors dark:bg-white dark:text-black dark:hover:bg-primary dark:hover:text-white">
                  Sign In With Google
                </button>
              </div>
            )}

            {/* Logged in but not contributor — show registration form */}
            {isLoggedIn && !isContributor && !regSuccess && (
              <div>
                <h2 className="text-2xl font-newsreader font-black mb-2 dark:text-white">Complete Your Profile</h2>
                <p className="text-sm font-inter opacity-60 mb-6 dark:text-white/60">Tell us about yourself to start writing.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-inter font-black uppercase tracking-widest opacity-60 dark:text-white/60">Full Name *</label>
                    <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full border-2 border-black dark:border-white/30 px-4 py-3 font-inter text-sm bg-transparent dark:text-white mt-1" />
                  </div>
                  <div>
                    <label className="text-[9px] font-inter font-black uppercase tracking-widest opacity-60 dark:text-white/60">Email</label>
                    <input value={userEmail || ""} disabled className="w-full border-2 border-black/20 px-4 py-3 font-inter text-sm bg-gray-50 dark:bg-white/5 dark:text-white/40 mt-1" />
                  </div>
                  <div>
                    <label className="text-[9px] font-inter font-black uppercase tracking-widest opacity-60 dark:text-white/60">Education</label>
                    <input value={form.education} onChange={e => setForm({ ...form, education: e.target.value })} placeholder="e.g., BA Political Science" className="w-full border-2 border-black dark:border-white/30 px-4 py-3 font-inter text-sm bg-transparent dark:text-white placeholder:opacity-40 mt-1" />
                  </div>
                  <div>
                    <label className="text-[9px] font-inter font-black uppercase tracking-widest opacity-60 dark:text-white/60">College/University</label>
                    <input value={form.college} onChange={e => setForm({ ...form, college: e.target.value })} placeholder="e.g., JNU, DU, IIIT" className="w-full border-2 border-black dark:border-white/30 px-4 py-3 font-inter text-sm bg-transparent dark:text-white placeholder:opacity-40 mt-1" />
                  </div>
                  <div>
                    <label className="text-[9px] font-inter font-black uppercase tracking-widest opacity-60 dark:text-white/60">Age</label>
                    <input type="number" value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} placeholder="25" className="w-full border-2 border-black dark:border-white/30 px-4 py-3 font-inter text-sm bg-transparent dark:text-white placeholder:opacity-40 mt-1" />
                  </div>
                  <div>
                    <label className="text-[9px] font-inter font-black uppercase tracking-widest opacity-60 dark:text-white/60">Gender</label>
                    <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })} className="w-full border-2 border-black dark:border-white/30 px-4 py-3 font-inter text-sm bg-transparent dark:text-white mt-1">
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="non-binary">Non-binary</option>
                      <option value="prefer-not-to-say">Prefer not to say</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-inter font-black uppercase tracking-widest opacity-60 dark:text-white/60"><Linkedin className="w-3 h-3 inline mr-1" />LinkedIn</label>
                    <input value={form.linkedin} onChange={e => setForm({ ...form, linkedin: e.target.value })} placeholder="linkedin.com/in/yourname" className="w-full border-2 border-black dark:border-white/30 px-4 py-3 font-inter text-sm bg-transparent dark:text-white placeholder:opacity-40 mt-1" />
                  </div>
                  <div>
                    <label className="text-[9px] font-inter font-black uppercase tracking-widest opacity-60 dark:text-white/60"><Twitter className="w-3 h-3 inline mr-1" />X (Twitter)</label>
                    <input value={form.twitter} onChange={e => setForm({ ...form, twitter: e.target.value })} placeholder="@yourhandle" className="w-full border-2 border-black dark:border-white/30 px-4 py-3 font-inter text-sm bg-transparent dark:text-white placeholder:opacity-40 mt-1" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[9px] font-inter font-black uppercase tracking-widest opacity-60 dark:text-white/60">Short Bio</label>
                    <textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} rows={3} placeholder="Tell us about your interests and expertise..." className="w-full border-2 border-black dark:border-white/30 px-4 py-3 font-inter text-sm bg-transparent dark:text-white placeholder:opacity-40 mt-1 resize-none" />
                  </div>
                </div>
                <button onClick={handleRegister} disabled={registering || !form.name} className="mt-6 bg-black text-white px-8 py-4 text-xs font-inter font-black uppercase tracking-widest hover:bg-primary transition-colors disabled:opacity-40 dark:bg-white dark:text-black dark:hover:bg-primary dark:hover:text-white">
                  {registering ? "Registering..." : "Register as Contributor"}
                </button>
              </div>
            )}

            {/* Registration success */}
            {isLoggedIn && regSuccess && (
              <div className="text-center">
                <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
                <h2 className="text-2xl font-newsreader font-black mb-2 dark:text-white">Welcome, Contributor!</h2>
                <p className="text-sm font-inter opacity-60 mb-6 dark:text-white/60">You&apos;re all set. Start writing your first article.</p>
                <Link href="/write/new" className="inline-block bg-black text-white px-8 py-4 text-xs font-inter font-black uppercase tracking-widest hover:bg-primary transition-colors dark:bg-white dark:text-black">
                  Start Writing <ArrowRight className="w-4 h-4 inline ml-2" />
                </Link>
              </div>
            )}

            {/* Already a contributor */}
            {isLoggedIn && isContributor && !regSuccess && (
              <div className="text-center">
                <h2 className="text-2xl font-newsreader font-black mb-4 dark:text-white">Welcome Back, {userName}!</h2>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/write/new" className="inline-flex items-center justify-center gap-2 bg-black text-white px-8 py-4 text-xs font-inter font-black uppercase tracking-widest hover:bg-primary transition-colors dark:bg-white dark:text-black">
                    <PenSquare className="w-4 h-4" /> Write New Article
                  </Link>
                  <Link href="/write/dashboard" className="inline-flex items-center justify-center gap-2 border-2 border-black dark:border-white/30 px-8 py-4 text-xs font-inter font-black uppercase tracking-widest hover:bg-black hover:text-white dark:text-white dark:hover:bg-white dark:hover:text-black transition-colors">
                    <Eye className="w-4 h-4" /> My Submissions
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
