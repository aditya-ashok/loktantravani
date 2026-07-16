import { createHmac } from "crypto";

/** Per-recipient unsubscribe token — HMAC so third parties can't forge one */
export function unsubToken(email: string): string {
  return createHmac("sha256", (process.env.ADMIN_API_KEY || "lv-unsub").trim())
    .update(email.toLowerCase().trim())
    .digest("hex")
    .slice(0, 32);
}
