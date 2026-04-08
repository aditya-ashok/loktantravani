"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import type { UserProfile } from "@/lib/types";
import { Camera, Sparkles, Loader2, Save, CheckCircle2, Languages, Bot } from "lucide-react";

export default function AuthorProfile() {
  const { userId, userName, userEmail, userPhotoUrl } = useAuth();
  const [profile, setProfile] = useState<Partial<UserProfile>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [generatingAvatar, setGeneratingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [translating, setTranslating] = useState<Record<string, boolean>>({});
  const [generatingBio, setGeneratingBio] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    try {
      const { isFirebaseConfigured } = await import("@/lib/firebase");
      if (!isFirebaseConfigured) { setLoading(false); return; }
      const { getUserProfile } = await import("@/lib/firebase-service");
      const p = await getUserProfile(userId);
      if (p) setProfile(p);
      else setProfile({ name: userName, email: userEmail || "", avatar: userPhotoUrl || "" });
    } catch {
      setProfile({ name: userName, email: userEmail || "" });
    }
    setLoading(false);
  }, [userId, userName, userEmail, userPhotoUrl]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    setSaved(false);
    try {
      const { upsertUserProfile } = await import("@/lib/firebase-service");
      await upsertUserProfile(userId, {
        name: profile.name || userName,
        email: profile.email || userEmail || "",
        bio: profile.bio || "",
        bioHi: profile.bioHi || "",
        avatar: avatarPreview || profile.avatar || "",
        designation: profile.designation || "",
        designationHi: profile.designationHi || "",
        nameHi: profile.nameHi || "",
        city: profile.city || "",
        twitter: profile.twitter || "",
        linkedin: profile.linkedin || "",
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert("Save failed: " + String(err));
    }
    setSaving(false);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024) { alert("Image must be under 500KB"); return; }
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const generateAIAvatar = async () => {
    setGeneratingAvatar(true);
    try {
      const name = profile.name || userName;
      const designation = profile.designation || "journalist";
      const res = await fetch("/api/lok-post/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "imagen-4.0-generate-001",
          action: "predict",
          body: {
            instances: [{
              prompt: `Professional headshot portrait photograph of an Indian ${designation} named ${name}. Formal attire, neutral studio background, newspaper staff photo style. Photorealistic, high quality, warm lighting. Square crop.`
            }],
            parameters: { sampleCount: 1, aspectRatio: "1:1" },
          },
        }),
      });
      const data = await res.json();
      const b64 = data.predictions?.[0]?.bytesBase64Encoded;
      if (b64) {
        setAvatarPreview(`data:image/png;base64,${b64}`);
      } else {
        alert("AI avatar generation failed. Make sure GEMINI_API_KEY is set.");
      }
    } catch (err) {
      alert("Error: " + String(err));
    }
    setGeneratingAvatar(false);
  };

  /** Translate a single field to Hindi */
  const translateField = async (field: "name" | "designation" | "bio") => {
    const text = profile[field];
    if (!text) return;
    const hiField = `${field}Hi` as "nameHi" | "designationHi" | "bioHi";
    setTranslating(t => ({ ...t, [field]: true }));
    try {
      const res = await fetch("/api/admin/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, field }),
      });
      const data = await res.json();
      if (data.hindi) {
        setProfile(p => ({ ...p, [hiField]: data.hindi }));
      } else {
        alert("Translation failed: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      alert("Translation error: " + String(err));
    }
    setTranslating(t => ({ ...t, [field]: false }));
  };

  /** Translate all fields at once */
  const translateAll = async () => {
    const fields: ("name" | "designation" | "bio")[] = ["name", "designation", "bio"];
    const toTranslate = fields.filter(f => profile[f]);
    for (const field of toTranslate) {
      await translateField(field);
    }
  };

  /** Generate AI bio (English + Hindi) */
  const handleGenerateBio = async () => {
    setGeneratingBio(true);
    try {
      const res = await fetch("/api/admin/generate-bio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profile.name || userName,
          designation: profile.designation || "",
          education: profile.education || "",
          college: profile.college || "",
          city: profile.city || "",
          gender: profile.gender || "",
        }),
      });
      const data = await res.json();
      if (data.bio) {
        setProfile(p => ({
          ...p,
          bio: data.bio,
          bioHi: data.bioHi || p.bioHi || "",
        }));
      } else {
        alert("Bio generation failed: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      alert("Error: " + String(err));
    }
    setGeneratingBio(false);
  };

  const currentAvatar = avatarPreview || profile.avatar || userPhotoUrl;
  const initials = (profile.name || userName || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const isAnyTranslating = Object.values(translating).some(Boolean);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-newsreader font-black uppercase">About Author</h2>
        <p className="text-[10px] font-inter font-black opacity-40 uppercase tracking-widest mt-1">
          {userId ? "Edit your profile" : "Sign in to manage your profile"}
        </p>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Left: Photo */}
        <div className="col-span-12 md:col-span-4">
          <div className="bg-white border-2 border-black p-6 text-center">
            {/* Avatar */}
            <div className="w-32 h-32 mx-auto mb-4 relative">
              {currentAvatar ? (
                <img src={currentAvatar} alt={profile.name} className="w-full h-full rounded-full object-cover border-4 border-primary" />
              ) : (
                <div className="w-full h-full rounded-full bg-primary text-white flex items-center justify-center text-3xl font-newsreader font-black">
                  {initials}
                </div>
              )}
              <label className="absolute bottom-0 right-0 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-primary transition-colors">
                <Camera className="w-4 h-4" />
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </label>
            </div>

            <p className="text-lg font-newsreader font-black">{profile.name || userName}</p>
            {profile.nameHi && <p className="text-sm font-inter text-primary hindi">{profile.nameHi}</p>}
            <p className="text-[9px] font-inter font-black uppercase tracking-widest text-primary mt-1">
              {profile.designation || profile.role || "Author"}
            </p>
            {profile.designationHi && <p className="text-[10px] font-inter opacity-60 hindi">{profile.designationHi}</p>}
            {profile.city && (
              <p className="text-[10px] font-inter opacity-50 mt-1">{profile.city}</p>
            )}

            {/* Upload / AI Avatar buttons */}
            <div className="mt-4 space-y-2">
              <label className="block w-full py-2 border-2 border-black text-[9px] font-inter font-black uppercase tracking-widest cursor-pointer hover:bg-black hover:text-white transition-colors text-center">
                <Camera className="w-3 h-3 inline mr-2" /> Upload Photo
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </label>
              <button
                onClick={generateAIAvatar}
                disabled={generatingAvatar}
                className="w-full py-2 bg-primary text-white text-[9px] font-inter font-black uppercase tracking-widest hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {generatingAvatar ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                {generatingAvatar ? "Generating..." : "Generate AI Avatar"}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Form */}
        <div className="col-span-12 md:col-span-8">
          <div className="bg-white border-2 border-black p-6 space-y-5">
            {/* Name — English + Hindi */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] font-inter font-black uppercase tracking-widest opacity-60 block mb-2">Full Name</label>
                <input
                  type="text"
                  value={profile.name || ""}
                  onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                  className="w-full border-2 border-black p-3 font-inter text-sm outline-none"
                  placeholder="Your name"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[9px] font-inter font-black uppercase tracking-widest opacity-60">नाम (Hindi)</label>
                  <button
                    onClick={() => translateField("name")}
                    disabled={!profile.name || translating.name}
                    className="text-[8px] font-inter font-black uppercase tracking-widest text-primary hover:underline disabled:opacity-30 flex items-center gap-1"
                  >
                    {translating.name ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Languages className="w-2.5 h-2.5" />}
                    Translate
                  </button>
                </div>
                <input
                  type="text"
                  value={profile.nameHi || ""}
                  onChange={e => setProfile(p => ({ ...p, nameHi: e.target.value }))}
                  className="w-full border-2 border-primary/30 p-3 font-inter text-sm outline-none hindi bg-orange-50/50"
                  placeholder="हिंदी नाम"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-[9px] font-inter font-black uppercase tracking-widest opacity-60 block mb-2">Email</label>
              <input
                type="email"
                value={profile.email || ""}
                onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
                className="w-full border-2 border-black p-3 font-inter text-sm outline-none opacity-60"
                disabled
              />
            </div>

            {/* Designation — English + Hindi */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] font-inter font-black uppercase tracking-widest opacity-60 block mb-2">Designation</label>
                <input
                  type="text"
                  value={profile.designation || ""}
                  onChange={e => setProfile(p => ({ ...p, designation: e.target.value }))}
                  className="w-full border-2 border-black p-3 font-inter text-sm outline-none"
                  placeholder="e.g., Sr. Correspondent, Editor-in-Chief"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[9px] font-inter font-black uppercase tracking-widest opacity-60">पदनाम (Hindi)</label>
                  <button
                    onClick={() => translateField("designation")}
                    disabled={!profile.designation || translating.designation}
                    className="text-[8px] font-inter font-black uppercase tracking-widest text-primary hover:underline disabled:opacity-30 flex items-center gap-1"
                  >
                    {translating.designation ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Languages className="w-2.5 h-2.5" />}
                    Translate
                  </button>
                </div>
                <input
                  type="text"
                  value={profile.designationHi || ""}
                  onChange={e => setProfile(p => ({ ...p, designationHi: e.target.value }))}
                  className="w-full border-2 border-primary/30 p-3 font-inter text-sm outline-none hindi bg-orange-50/50"
                  placeholder="हिंदी पदनाम"
                />
              </div>
            </div>

            {/* City */}
            <div>
              <label className="text-[9px] font-inter font-black uppercase tracking-widest opacity-60 block mb-2">City / Bureau</label>
              <input
                type="text"
                value={profile.city || ""}
                onChange={e => setProfile(p => ({ ...p, city: e.target.value }))}
                className="w-full border-2 border-black p-3 font-inter text-sm outline-none"
                placeholder="e.g., New Delhi, Patna, Guwahati"
              />
            </div>

            {/* Bio — English */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[9px] font-inter font-black uppercase tracking-widest opacity-60">Bio</label>
                <button
                  onClick={handleGenerateBio}
                  disabled={generatingBio}
                  className="text-[8px] font-inter font-black uppercase tracking-widest text-primary hover:underline disabled:opacity-30 flex items-center gap-1"
                >
                  {generatingBio ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Bot className="w-2.5 h-2.5" />}
                  {generatingBio ? "Generating..." : "Generate AI Bio"}
                </button>
              </div>
              <textarea
                value={profile.bio || ""}
                onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
                rows={3}
                className="w-full border-2 border-black p-3 font-inter text-sm outline-none resize-none"
                placeholder="Tell readers about yourself — your beat, experience, and what drives your journalism."
              />
            </div>

            {/* Bio — Hindi */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[9px] font-inter font-black uppercase tracking-widest opacity-60">परिचय (Hindi Bio)</label>
                <button
                  onClick={() => translateField("bio")}
                  disabled={!profile.bio || translating.bio}
                  className="text-[8px] font-inter font-black uppercase tracking-widest text-primary hover:underline disabled:opacity-30 flex items-center gap-1"
                >
                  {translating.bio ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Languages className="w-2.5 h-2.5" />}
                  Translate from English
                </button>
              </div>
              <textarea
                value={profile.bioHi || ""}
                onChange={e => setProfile(p => ({ ...p, bioHi: e.target.value }))}
                rows={3}
                className="w-full border-2 border-primary/30 p-3 font-inter text-sm outline-none resize-none hindi bg-orange-50/50"
                placeholder="हिंदी में अपना परिचय लिखें..."
              />
            </div>

            {/* Social links */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] font-inter font-black uppercase tracking-widest opacity-60 block mb-2">X / Twitter</label>
                <input
                  type="text"
                  value={profile.twitter || ""}
                  onChange={e => setProfile(p => ({ ...p, twitter: e.target.value }))}
                  className="w-full border-2 border-black p-3 font-inter text-sm outline-none"
                  placeholder="@handle"
                />
              </div>
              <div>
                <label className="text-[9px] font-inter font-black uppercase tracking-widest opacity-60 block mb-2">LinkedIn</label>
                <input
                  type="text"
                  value={profile.linkedin || ""}
                  onChange={e => setProfile(p => ({ ...p, linkedin: e.target.value }))}
                  className="w-full border-2 border-black p-3 font-inter text-sm outline-none"
                  placeholder="linkedin.com/in/..."
                />
              </div>
            </div>

            {/* Translate All + Save */}
            <div className="flex gap-3">
              <button
                onClick={translateAll}
                disabled={isAnyTranslating || (!profile.name && !profile.designation && !profile.bio)}
                className="flex-1 py-3 border-2 border-primary text-primary font-inter font-black text-xs uppercase tracking-widest hover:bg-primary hover:text-white flex items-center justify-center gap-2 disabled:opacity-30 transition-colors"
              >
                {isAnyTranslating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Languages className="w-4 h-4" />}
                {isAnyTranslating ? "Translating..." : "Translate All to Hindi"}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-3 bg-black text-white font-inter font-black text-xs uppercase tracking-widest hover:bg-primary flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {saving ? "Saving..." : saved ? "Saved!" : "Save Profile"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
