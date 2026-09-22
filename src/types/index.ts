// Central type definitions for QFF 2026.
// These map loosely onto the future database entities (see /docs/ARCHITECTURE.md)
// so that the eventual Prisma schema (Speaker, ScheduleItem, TeamMember, ...)
// can be generated from shapes that already match the UI.

export interface NavItem {
  label: string;
  href: string; // section id, e.g. "#details"
}

export interface EventDetail {
  label: string;
  value: string;
  icon: "calendar" | "map-pin" | "users" | "clock" | "ticket" | "layers";
}

export interface HackathonCard {
  id: string;
  title: string;
  description: string;
  icon: "flag" | "puzzle" | "timeline" | "gavel" | "trophy" | "check-circle";
}

export interface ScheduleItem {
  id: string;
  day: string; // "Day 1", "Day 2" — grouping key
  time: string;
  title: string;
  description: string;
  track?: string;
}

export interface SocialLink {
  platform: "instagram" | "linkedin" | "x" | "github" | "youtube" | "discord" | "mail";
  href: string;
  handle?: string;
}

export interface Speaker {
  id: string;
  name: string;
  designation: string;
  organization: string;
  bio: string;
  imageSeed: string; // used to generate a deterministic placeholder avatar
  socials: SocialLink[];
}

export interface Collaboration {
  id: string;
  name: string;
  tier: "title" | "partner" | "collaborator";
  logoInitial: string; // placeholder mark shown until a real logo is supplied
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  team: string;
  imageSeed: string;
  socials: SocialLink[];
}


export interface RegistrationPerk {
  id: string;
  title: string;
  description: string;
  icon: "cpu" | "award" | "book-open" | "users" | "gift" | "coffee";
}

export interface RegistrationFaq {
  id: string;
  question: string;
  answer: string;
}

export interface RegistrationFormData {
  fullName: string;
  email: string;
  phone: string;
  institution: string;
  studyLevel: string;
  graduationYear: string;
  attendanceMode: "offline" | "online";
  quantumExperience: string;
  interests: string[];
  githubUrl: string;
  linkedinUrl: string;
  tshirtSize: string;
  referredByCode: string;
  agreedToTerms: boolean;
}

export interface RegistrationResponse {
  success?: boolean;
  ticketId?: string;
  referralCode?: string;
  message?: string;
  error?: string;
}

export interface RegistrationActionResult {
  success: boolean;
  ticketId?: string;
  referralCode?: string;
  message?: string;
  error?: string;
  statusCode?: number;
}
