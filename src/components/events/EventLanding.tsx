import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EventRegistration from "@/components/events/EventRegistration";
import type { LvEvent } from "@/lib/events";

export function eventMetadata(event: LvEvent): Metadata {
  const title = `${event.title.en} with ${event.guest} — Register`;
  return {
    title,
    description: event.description.en,
    alternates: { canonical: event.path },
    openGraph: { title, description: event.description.en, url: event.path, images: [{ url: event.poster, width: 980, height: 1225 }] },
    twitter: { card: "summary_large_image", title, description: event.description.en, images: [event.poster] },
  };
}

export default function EventLanding({ event }: { event: LvEvent }) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-[80px] md:pt-[108px] bg-[#F7F8FC] text-slate-900">
        <div className="h-1 bg-gradient-to-r from-[#3B6BFF] via-[#FFD600] to-[#3B6BFF]" />
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-10">
          <EventRegistration slug={event.slug} />
        </div>
      </main>
      <Footer />
    </>
  );
}
