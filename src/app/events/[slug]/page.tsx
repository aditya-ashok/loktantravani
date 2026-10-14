import type { Metadata } from "next";
import { notFound } from "next/navigation";
import EventLanding, { eventMetadata } from "@/components/events/EventLanding";
import { EVENTS, getEvent } from "@/lib/events";

export function generateStaticParams() {
  return EVENTS.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const event = getEvent((await params).slug);
  return event ? eventMetadata(event) : {};
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const event = getEvent((await params).slug);
  if (!event) notFound();
  return <EventLanding event={event} />;
}
