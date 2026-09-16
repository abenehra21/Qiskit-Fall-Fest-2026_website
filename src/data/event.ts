import type { EventDetail } from "@/types";

/**
 * Top-level event metadata. Replace these placeholder strings with the real
 * values once they're confirmed — nothing else in the codebase needs to change.
 */
export const event = {
  fullName: "PLUS Qiskit Fall Fest 2026",
  shortName: "QFF 2026",
  organizer: "BITS GOA",
  tagline:
    "A campus-wide gathering for quantum computing, in circuits and in community.",
  /* Rendered as a single paragraph by SectionHeading, so it is written as one.
     Its job is to say what Qiskit Fall Fest actually is — most visitors will
     not know — without restating the facts grid directly beneath it. */
  description:
    "Qiskit Fall Fest is IBM's program of student-run quantum computing events, hosted each year by universities around the world. This is BITS Goa's: five days of workshops that build circuits up from the linear algebra, talks from people working in the field, and a 24-hour hackathon on IBM's quantum hardware. No prior quantum experience assumed. Python and first-year linear algebra are enough.",
  registerHref: "/registration",
  exploreHref: "#hackathon",

  /* The facts, stated once. These were previously literals inside three
     different components, which is how the schedule came to advertise a date
     range while the details grid still said the dates were unannounced. */
  dates: "28 Oct — 1 Nov 2026",
  format: "Talks · Workshops · 24h Hackathon",
  venueName: "BITS Pilani, K.K. Birla Goa Campus",
  venueShort: "BITS Goa campus",
  venueAddress: "NH 17B, Bypass Road, Zuarinagar, Sancoale, Goa 403726, India",
  venueMapHref:
    "https://www.google.com/maps/search/?api=1&query=BITS+Pilani+K.K.+Birla+Goa+Campus",
};

export const eventDetails: EventDetail[] = [
  {
    label: "Dates",
    value: event.dates,
    icon: "calendar",
  },
  {
    label: "Venue",
    value: event.venueName,
    icon: "map-pin",
  },
  {
    label: "Format",
    value: event.format,
    icon: "layers",
  },
  {
    label: "Who can join",
    value: "Open to all students",
    icon: "users",
  },
  {
    label: "Registration",
    value: "To be announced",
    icon: "ticket",
  },
  {
    label: "Duration",
    value: "5 days",
    icon: "clock",
  },
];
