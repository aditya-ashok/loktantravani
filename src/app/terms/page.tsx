import type { Metadata } from "next";
import TermsContent from "./TermsContent";

export const metadata: Metadata = {
  title: "Terms of Service | LoktantraVani",
  description:
    "Terms of Service for LoktantraVani — India's 1st AI-powered newspaper. Read our terms governing use of our platform, AI-generated content, subscriptions, and more.",
  openGraph: {
    title: "Terms of Service | LoktantraVani",
    description:
      "Terms of Service for LoktantraVani — India's 1st AI-powered newspaper.",
    url: "https://loktantravani.in/terms",
  },
};

export default function TermsPage() {
  return <TermsContent />;
}
