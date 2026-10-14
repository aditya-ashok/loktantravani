import type { Metadata } from "next";
import EventLanding, { eventMetadata } from "@/components/events/EventLanding";
import { getEvent } from "@/lib/events";

const event = getEvent("ai-public-policy")!;

export const metadata: Metadata = eventMetadata(event);

export default function ChitChatPage() {
  return <EventLanding event={event} />;
}
