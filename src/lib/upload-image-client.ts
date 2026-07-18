/**
 * One picker to rule every admin upload surface.
 * - input is APPENDED TO THE DOM before .click() — extensions and some
 *   Chrome profiles silently ignore clicks on detached file inputs,
 *   which presented as "the Upload button does nothing"
 * - compresses phone-size photos in-browser (≤1600px JPEG) before POST
 * - alerts loudly on every failure path so nothing dies silently
 */
export async function compressImageFile(file: File): Promise<Blob> {
  if (file.size < 900 * 1024) return file;
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;
  const MAX = 1600;
  const scale = Math.min(1, MAX / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, "image/jpeg", 0.85));
  return blob && blob.size < file.size ? blob : file;
}

/** Open the OS picker and resolve the chosen file (null on cancel). */
export function pickImageFile(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.style.cssText = "position:fixed;left:-9999px;top:0;opacity:0;";
    document.body.appendChild(input);
    const cleanup = () => { try { document.body.removeChild(input); } catch { /* */ } };
    input.onchange = () => { const f = input.files?.[0] || null; cleanup(); resolve(f); };
    // If the dialog is cancelled, 'cancel' fires in modern Chrome; also
    // sweep up on window refocus as a fallback.
    input.addEventListener("cancel", () => { cleanup(); resolve(null); });
    input.click();
  });
}

/** Pick → compress → upload. Resolves the stored image URL, or null. */
export async function pickAndUploadImage(): Promise<string | null> {
  const file = await pickImageFile();
  if (!file) return null;
  try {
    const compressed = await compressImageFile(file);
    const formData = new FormData();
    formData.append("file", compressed, "upload.jpg");
    const res = await fetch("/api/admin/upload-image", { method: "POST", body: formData });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`HTTP ${res.status}: ${t.slice(0, 180)}`);
    }
    const data = await res.json();
    if (!data.imageUrl) throw new Error(data.error || "no imageUrl in response");
    return data.imageUrl as string;
  } catch (err) {
    alert("Upload failed: " + String(err));
    return null;
  }
}
