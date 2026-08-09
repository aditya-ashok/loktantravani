"use client";

/**
 * Caricature Bank — canonical caricature per public figure. These become
 * likeness references for every AI-generated cartoon and thumbnail, so the
 * same face appears consistently across the paper.
 */

import { useEffect, useState, useCallback } from "react";
import { Palette, Plus, Trash2, RefreshCw, Loader2, Upload } from "lucide-react";

type BankEntry = { id: string; name: string; nameHi: string; description: string; imageUrl: string };

export default function CaricatureBankPanel() {
  const [entries, setEntries] = useState<BankEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [nameHi, setNameHi] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/caricatures");
      const data = await res.json();
      setEntries(data.caricatures || []);
    } catch { /* */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!name.trim()) return;
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/admin/caricatures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), nameHi: nameHi.trim(), description: description.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setName(""); setNameHi(""); setDescription("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    }
    setCreating(false);
  };

  const regenerate = async (entry: BankEntry) => {
    setBusyId(entry.id);
    try {
      await fetch("/api/admin/caricatures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: entry.id, name: entry.name, nameHi: entry.nameHi, description: entry.description, regenerate: true }),
      });
      await load();
    } catch { /* */ }
    setBusyId("");
  };

  const uploadImage = async (entry: BankEntry, file: File) => {
    setBusyId(entry.id);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const up = await fetch("/api/admin/upload-image", { method: "POST", body: formData });
      const upData = await up.json();
      if (upData.url) {
        await fetch("/api/admin/caricatures", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: entry.id, name: entry.name, nameHi: entry.nameHi, description: entry.description, imageUrl: upData.url }),
        });
        await load();
      }
    } catch { /* */ }
    setBusyId("");
  };

  const remove = async (id: string) => {
    if (!confirm("Remove this caricature from the bank?")) return;
    setBusyId(id);
    try {
      await fetch("/api/admin/caricatures", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      await load();
    } catch { /* */ }
    setBusyId("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-newsreader font-black uppercase flex items-center gap-3">
          <Palette className="w-8 h-8 text-primary" /> Caricature Bank
        </h2>
        <p className="text-[10px] font-inter font-black opacity-40 uppercase tracking-widest mt-1">
          Canonical faces — every AI cartoon uses these as likeness references
        </p>
      </div>

      {/* Add new */}
      <div className="bg-white border-2 border-black p-6">
        <h3 className="text-sm font-inter font-black uppercase tracking-widest mb-4">Add a Figure</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Name (e.g. Narendra Modi)"
            className="border-2 border-black p-2.5 text-sm font-inter outline-none" />
          <input value={nameHi} onChange={e => setNameHi(e.target.value)} placeholder="नाम (Hindi, optional)"
            className="border-2 border-black p-2.5 text-sm font-inter outline-none" />
          <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Role hint (e.g. Bihar BJP minister)"
            className="border-2 border-black p-2.5 text-sm font-inter outline-none" />
        </div>
        <button onClick={create} disabled={creating || !name.trim()}
          className="px-6 py-3 bg-black text-white text-[10px] font-inter font-black uppercase tracking-widest hover:bg-primary disabled:opacity-40 flex items-center gap-2">
          {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          {creating ? "Painting portrait…" : "Generate & Add"}
        </button>
        {error && <p className="text-xs font-inter text-red-600 mt-2">{error}</p>}
        <p className="text-[9px] font-inter opacity-40 mt-2">
          Gemini paints the canonical portrait. If the likeness is off, use Upload on the card to replace it with your own caricature — articles mentioning the name will then use YOUR image as the face reference.
        </p>
      </div>

      {/* Bank grid */}
      {loading ? (
        <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {entries.map(entry => (
            <div key={entry.id} className="border-2 border-black bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <div className="aspect-square overflow-hidden bg-gray-100">
                {entry.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={entry.imageUrl} alt={entry.name} className="w-full h-full object-cover" />
                )}
              </div>
              <div className="p-3">
                <p className="text-sm font-newsreader font-black leading-tight">{entry.name}</p>
                {entry.nameHi && <p className="text-[10px] font-inter opacity-50">{entry.nameHi}</p>}
                {entry.description && <p className="text-[9px] font-inter opacity-40 mt-0.5 line-clamp-1">{entry.description}</p>}
                <div className="flex gap-1.5 mt-2.5">
                  <button onClick={() => regenerate(entry)} disabled={busyId === entry.id} title="Repaint with AI"
                    className="flex-1 py-1.5 border border-black text-[8px] font-inter font-black uppercase tracking-widest hover:bg-black hover:text-white disabled:opacity-40 flex items-center justify-center gap-1">
                    {busyId === entry.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} Repaint
                  </button>
                  <label title="Upload your own" className="flex-1 py-1.5 border border-black text-[8px] font-inter font-black uppercase tracking-widest hover:bg-black hover:text-white cursor-pointer flex items-center justify-center gap-1">
                    <Upload className="w-3 h-3" /> Upload
                    <input type="file" accept="image/*" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(entry, f); e.target.value = ""; }} />
                  </label>
                  <button onClick={() => remove(entry.id)} disabled={busyId === entry.id} title="Remove"
                    className="py-1.5 px-2 border border-red-600 text-red-600 hover:bg-red-600 hover:text-white disabled:opacity-40">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {entries.length === 0 && (
            <p className="col-span-full text-sm font-inter opacity-40 py-8 text-center">No figures yet — add your first above.</p>
          )}
        </div>
      )}
    </div>
  );
}
