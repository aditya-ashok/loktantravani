/**
 * Field-level encryption for personal data stored via the Firestore REST
 * client. That client is unauthenticated (public API key), so anything it can
 * read, the public can read too — PII must be ciphertext at rest.
 *
 * AES-256-GCM, key derived from CRON_SECRET (server-only). Values look like
 * "enc:v1:<base64 iv|tag|ciphertext>".
 */
import crypto from "crypto";

const PREFIX = "enc:v1:";

function key(): Buffer {
  const secret = (process.env.CRON_SECRET || "").trim();
  if (!secret) throw new Error("CRON_SECRET not configured — refusing to store personal data unencrypted");
  return crypto.createHash("sha256").update(`loktantravani-pii-v1:${secret}`).digest();
}

/** Throws if no secret is configured, so callers never fall back to plaintext. */
export function assertPiiKey() {
  key();
}

export function encryptPii(value: string): string {
  if (!value) return "";
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const ct = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return PREFIX + Buffer.concat([iv, cipher.getAuthTag(), ct]).toString("base64");
}

export function decryptPii(value: unknown): string {
  if (typeof value !== "string" || !value) return "";
  if (!value.startsWith(PREFIX)) return value;
  try {
    const buf = Buffer.from(value.slice(PREFIX.length), "base64");
    const decipher = crypto.createDecipheriv("aes-256-gcm", key(), buf.subarray(0, 12));
    decipher.setAuthTag(buf.subarray(12, 28));
    return Buffer.concat([decipher.update(buf.subarray(28)), decipher.final()]).toString("utf8");
  } catch {
    return "[unreadable]";
  }
}

/** Stable, non-reversible id for a value (e.g. dedupe by email) without exposing it. */
export function piiHash(value: string): string {
  return crypto.createHmac("sha256", key()).update(value).digest("hex").slice(0, 32);
}
