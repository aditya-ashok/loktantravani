"use client";

import React, { useState } from "react";
import Image from "next/image";
import { CalendarClock, MapPin, Sparkles, Loader2, CheckCircle2, Share2, Bot, AlertTriangle, Users } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { getEvent, PROFESSIONS } from "@/lib/events";

type Result = {
  updated: boolean;
  question: { refined: string; theme: string | null; flagged: boolean } | null;
};

const input =
  "w-full bg-white/5 border border-white/15 rounded p-3 text-sm focus:outline-none focus:border-[#3B6BFF] placeholder:text-white/35";
const label = "block text-xs font-bold uppercase tracking-widest text-white/60 mb-1.5";

export default function EventRegistration({ slug }: { slug: string }) {
  const { lang, t } = useLanguage();
  const event = getEvent(slug);

  const [form, setForm] = useState({
    name: "", email: "", phone: "", city: "", profession: PROFESSIONS[0].en,
    organisation: "", mode: "in-person", question: "", consent: false, website: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  const [idea, setIdea] = useState("");
  const [suggesting, setSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  if (!event) return null;
  const tr = (v: { en: string; hi: string }) => (lang === "hi" ? v.hi : v.en);
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }));

  const when = event.date
    ? new Date(event.date).toLocaleString(lang === "hi" ? "hi-IN" : "en-IN", { dateStyle: "full", timeStyle: "short", timeZone: "Asia/Kolkata" })
    : t("To be informed", "जल्द घोषित होगी");

  const suggest = async () => {
    setSuggesting(true);
    setError("");
    try {
      const res = await fetch("/api/events/suggest-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: slug, idea, language: lang }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuggestions(data.questions || []);
    } catch (e) {
      setError((e as Error).message || t("AI suggestions are unavailable right now.", "AI सुझाव अभी उपलब्ध नहीं हैं।"));
    }
    setSuggesting(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/events/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, event: slug, language: lang }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult({ updated: !!data.updated, question: data.question || null });
    } catch (err) {
      setError((err as Error).message || t("Something went wrong.", "कुछ गड़बड़ हुई।"));
    }
    setSubmitting(false);
  };

  const share = () => {
    const url = `${window.location.origin}${event.path}`;
    const text = `${tr(event.title)} — ${event.guest}, ${tr(event.guestRole)}. ${t("Register free on LoktantraVani:", "LoktantraVani पर मुफ्त पंजीकरण करें:")} ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  };

  return (
    <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-8 items-start">
      {/* Event card */}
      <aside className="space-y-4 lg:sticky lg:top-24">
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg border border-white/10">
          <Image src={event.poster} alt={`${tr(event.title)} — ${event.guest}`} fill sizes="(max-width: 1024px) 100vw, 420px" className="object-cover" priority />
        </div>
        <div className="rounded-lg border border-[#3B6BFF]/30 bg-[#3B6BFF]/10 p-4 space-y-2 text-sm">
          <p className="inline-block text-[10px] font-black uppercase tracking-widest bg-[#FFD600] text-black px-2 py-0.5 rounded-sm">{tr(event.show)}</p>
          <h2 className="text-xl font-black">{tr(event.title)}</h2>
          <p><span className="font-bold">{event.guest}</span> · <span className="text-white/70">{tr(event.guestRole)}</span></p>
          {event.panelists.length > 0 && (
            <div className="flex items-start gap-2 text-white/80">
              <Users className="w-4 h-4 text-[#FFD600] shrink-0 mt-0.5" />
              <div>
                <p className="text-white/50">{t("Panelists", "पैनलिस्ट")}</p>
                <ul className="space-y-1 mt-0.5">
                  {event.panelists.map((p) => (
                    <li key={p.name}>
                      <span className="font-bold text-white">{p.name}</span>
                      <span className="block text-xs text-white/60">{tr(p.bio)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          <p className="flex items-center gap-2 text-white/80"><CalendarClock className="w-4 h-4 text-[#FFD600]" /> {when}</p>
          {event.venue && <p className="flex items-center gap-2 text-white/80"><MapPin className="w-4 h-4 text-[#FFD600]" /> {tr(event.venue)}</p>}
          <p className="text-white/60 leading-relaxed pt-1">{tr(event.description)}</p>
        </div>
      </aside>

      {/* Form / confirmation */}
      {result ? (
        <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-6 space-y-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-8 h-8 text-green-400 shrink-0" />
            <div>
              <h3 className="text-2xl font-black">
                {result.updated ? t("Registration updated", "पंजीकरण अपडेट हुआ") : t("You're registered!", "आपका पंजीकरण हो गया!")}
              </h3>
              <p className="text-white/70 text-sm mt-1">
                {event.date
                  ? t("We've emailed you the details.", "हमने आपको विवरण ईमेल कर दिया है।")
                  : t("The date will be announced soon — we'll email you as soon as it is.", "तिथि जल्द घोषित होगी — घोषणा होते ही हम आपको ईमेल करेंगे।")}
              </p>
            </div>
          </div>

          {result.question && (
            <div className="rounded border border-white/10 bg-white/5 p-4 space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest text-[#FFD600] flex items-center gap-2">
                <Bot className="w-4 h-4" /> {t("Your question, as our AI filed it", "आपका प्रश्न, जैसा हमारे AI ने दर्ज किया")}
              </p>
              <p className="text-sm">{result.question.refined}</p>
              {result.question.theme && (
                <p className="text-xs text-white/50">{t("Theme:", "विषय:")} {result.question.theme}</p>
              )}
              {result.question.flagged && (
                <p className="text-xs text-yellow-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {t("This question may not be selected as it doesn't meet our community guidelines.", "यह प्रश्न सामुदायिक दिशानिर्देशों के अनुरूप न होने से शायद चुना न जाए।")}
                </p>
              )}
            </div>
          )}

          <button onClick={share} className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-black font-black uppercase tracking-widest py-3 rounded">
            <Share2 className="w-4 h-4" /> {t("Invite friends on WhatsApp", "WhatsApp पर दोस्तों को बुलाएं")}
          </button>
          <button onClick={() => setResult(null)} className="text-xs text-white/50 hover:text-white">
            {t("Edit my registration", "मेरा पंजीकरण बदलें")}
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5" noValidate>
          <div>
            <h3 className="text-2xl font-black">{t("Register for the show", "शो के लिए पंजीकरण करें")}</h3>
            <p className="text-white/50 text-sm mt-1">{t("Free entry. Fields marked * are required.", "प्रवेश निःशुल्क। * वाले फ़ील्ड आवश्यक हैं।")}</p>
          </div>

          {/* Honeypot (hidden from people, filled by bots) */}
          <input type="text" name="website" value={form.website} onChange={(e) => set("website", e.target.value)}
            tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="reg-name" className={label}>{t("Full name", "पूरा नाम")} *</label>
              <input id="reg-name" required maxLength={100} autoComplete="name" value={form.name} onChange={(e) => set("name", e.target.value)} className={input} />
            </div>
            <div>
              <label htmlFor="reg-email" className={label}>{t("Email", "ईमेल")} *</label>
              <input id="reg-email" type="email" required maxLength={200} autoComplete="email" value={form.email} onChange={(e) => set("email", e.target.value)} className={input} />
            </div>
            <div>
              <label htmlFor="reg-phone" className={label}>{t("WhatsApp number", "WhatsApp नंबर")}</label>
              <input id="reg-phone" type="tel" maxLength={16} autoComplete="tel" placeholder="+91" value={form.phone} onChange={(e) => set("phone", e.target.value)} className={input} />
            </div>
            <div>
              <label htmlFor="reg-city" className={label}>{t("City", "शहर")} *</label>
              <input id="reg-city" required maxLength={80} autoComplete="address-level2" value={form.city} onChange={(e) => set("city", e.target.value)} className={input} />
            </div>
            <div>
              <label htmlFor="reg-prof" className={label}>{t("You are a…", "आप हैं…")}</label>
              <select id="reg-prof" value={form.profession} onChange={(e) => set("profession", e.target.value)} className={`${input} bg-[#13131a]`}>
                {PROFESSIONS.map((p) => <option key={p.en} value={p.en}>{tr(p)}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="reg-org" className={label}>{t("College / organisation", "कॉलेज / संस्था")}</label>
              <input id="reg-org" maxLength={120} autoComplete="organization" value={form.organisation} onChange={(e) => set("organisation", e.target.value)} className={input} />
            </div>
          </div>

          <fieldset>
            <legend className={label}>{t("How will you join?", "आप कैसे जुड़ेंगे?")}</legend>
            <div className="flex gap-2">
              {([["in-person", t("In person", "व्यक्तिगत रूप से")], ["online", t("Online / live stream", "ऑनलाइन / लाइव")]] as const).map(([value, text]) => (
                <button type="button" key={value} onClick={() => set("mode", value)} aria-pressed={form.mode === value}
                  className={`flex-1 p-3 rounded border text-sm font-bold ${form.mode === value ? "border-[#3B6BFF] bg-[#3B6BFF]/15 text-white" : "border-white/15 text-white/60"}`}>
                  {text}
                </button>
              ))}
            </div>
          </fieldset>

          {/* AI-assisted question */}
          <div className="rounded-lg border border-[#FFD600]/30 bg-[#FFD600]/5 p-4 space-y-3">
            <label htmlFor="reg-question" className={`${label} !text-[#FFD600] flex items-center gap-2`}>
              <Sparkles className="w-4 h-4" /> {t(`Your question for ${event.guest}`, `${event.guest} से आपका प्रश्न`)}
            </label>
            <textarea id="reg-question" rows={3} maxLength={600} value={form.question} onChange={(e) => set("question", e.target.value)}
              placeholder={t("Ask anything on AI & public policy. Our AI will help shortlist the best questions for the show.", "AI और सार्वजनिक नीति पर कुछ भी पूछें। हमारा AI शो के लिए सर्वश्रेष्ठ प्रश्न चुनने में मदद करेगा।")}
              className={`${input} resize-none`} />
            <div className="flex flex-col sm:flex-row gap-2">
              <input value={idea} onChange={(e) => setIdea(e.target.value)} maxLength={400}
                placeholder={t("Not sure? Type a topic (e.g. AI and jobs)…", "पक्का नहीं? कोई विषय लिखें (जैसे AI और नौकरियां)…")}
                className={`${input} flex-1`} />
              <button type="button" onClick={suggest} disabled={suggesting}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded bg-[#FFD600] text-black text-sm font-black disabled:opacity-50 shrink-0">
                {suggesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />} {t("Ask AI for ideas", "AI से सुझाव लें")}
              </button>
            </div>
            {suggestions.length > 0 && (
              <ul className="space-y-2">
                {suggestions.map((q, i) => (
                  <li key={i}>
                    <button type="button" onClick={() => set("question", q)}
                      className={`w-full text-left text-sm p-3 rounded border transition-colors ${form.question === q ? "border-[#FFD600] bg-[#FFD600]/10" : "border-white/10 hover:border-white/30"}`}>
                      {q}
                    </button>
                  </li>
                ))}
                <li className="text-[11px] text-white/40">{t("Tap a suggestion to use it — you can edit it after.", "सुझाव पर टैप करें — बाद में बदल सकते हैं।")}</li>
              </ul>
            )}
          </div>

          <label className="flex items-start gap-3 text-sm text-white/70 cursor-pointer">
            <input type="checkbox" checked={form.consent} onChange={(e) => set("consent", e.target.checked)} className="mt-1 accent-[#3B6BFF]" />
            <span>{t("I agree to be contacted by LoktantraVani by email/WhatsApp about this event. *", "मैं इस कार्यक्रम के बारे में LoktantraVani द्वारा ईमेल/WhatsApp पर संपर्क किए जाने के लिए सहमत हूं। *")}</span>
          </label>

          {error && <p className="text-red-400 text-sm" role="alert">{error}</p>}

          <button type="submit" disabled={submitting || !form.name.trim() || !form.email.trim() || !form.city.trim() || !form.consent}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#3B6BFF] to-[#1E3FD8] disabled:opacity-40 text-white font-black uppercase tracking-widest py-3.5 rounded">
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />} {t("Register now", "अभी पंजीकरण करें")}
          </button>
        </form>
      )}
    </div>
  );
}
