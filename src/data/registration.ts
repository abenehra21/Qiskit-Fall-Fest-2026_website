import type {
  RegistrationPerk,
  RegistrationFaq,
} from "@/types";

export const registrationHeader = {
  eyebrow: "00 · Registration",
  title: "Reserve Your Spot at QFF 2026",
  tagline: "BITS Qiskit Fall Fest 2026 — BITS Pilani",
  description:
    "Five days at BITS Goa — workshops, talks, and a 24-hour hackathon on IBM Quantum hardware. Free for students, in person or online. Registration is required to attend.",
};

export const attendanceOptions = [
  {
    id: "offline" as const,
    label: "In-Person (Offline)",
    tagline: "BITS Pilani Campus",
    description:
      "Join us on campus at BITS Pilani. Attend live keynote sessions, hands-on lab activities, on-site hackathon sprint, and meals.",
    badge: "On Campus",
  },
  {
    id: "online" as const,
    label: "Virtual (Online)",
    tagline: "Livestream & Discord Community",
    description:
      "Participate remotely from anywhere. Access talk livestreams, online technical mentorship, and remote hackathon submissions.",
    badge: "Remote Access",
  },
];

export const registrationPerks: RegistrationPerk[] = [
  {
    id: "certificates",
    title: "Official IBM & BITS Certificate",
    description:
      "Issued jointly by IBM and BITS Pilani after the fest, covering attendance, workshop completion and hackathon participation.",
    icon: "award",
  },
  {
    id: "workshops",
    title: "Hands-on Guided Workshops",
    description:
      "Build circuits in Qiskit from scratch, then the algorithm families the hackathon problems reach for: VQE, QAOA, quantum machine learning and error mitigation.",
    icon: "book-open",
  },
  {
    id: "food",
    title: "Food & Refreshments",
    description:
      "Meals and coffee through the full 24 hours of the hackathon, for anyone attending on campus.",
    icon: "coffee",
  },
];

export const experienceLevels = [
  {
    id: "beginner",
    label: "Beginner",
    detail: "New to quantum computing, have basic familiarity with Python & matrices.",
  },
  {
    id: "intermediate",
    label: "Intermediate",
    detail: "Know quantum gates, statevectors, and have written simple Qiskit circuits.",
  },
  {
    id: "advanced",
    label: "Advanced / Researcher",
    detail: "Experienced with quantum algorithms, noise models, error mitigation, or QML.",
  },
];

export const quantumInterests = [
  "Quantum Machine Learning (QML)",
  "Quantum Algorithms & Complexity",
  "Quantum Error Mitigation & Correction",
  "Quantum Chemistry & Materials Simulation",
  "Quantum Cryptography & Quantum Key Distribution",
  "Combinatorial Optimization (QAOA / VQE)",
  "Pulse-Level Quantum Control",
];

export const studyLevels = [
  "Undergraduate - 1st / 2nd Year",
  "Undergraduate - 3rd / 4th Year",
  "Dual Degree / 5th Year",
  "Master's (M.Sc / M.Tech / MS)",
  "PhD / Doctoral Researcher",
  "Faculty / Professional",
];

export const tshirtSizes = ["S (36\")", "M (38\")", "L (40\")", "XL (42\")", "2XL (44\")"];

export const registrationFaqs: RegistrationFaq[] = [
  {
    id: "cost",
    question: "Is registration really completely free?",
    answer:
      "Yes! Thanks to IBM Quantum and BITS Pilani, participation in all workshops, keynote sessions, compute hardware access, swag, and hackathon meals are 100% free for admitted students.",
  },
  {
    id: "prerequisites",
    question: "Do I need prior quantum computing experience?",
    answer:
      "No! The workshops and lab sessions are deliberately designed from the fundamentals up. If you know basic Python and college-level linear algebra, you will be able to follow and build real quantum circuits.",
  },
  {
    id: "teams",
    question: "How do hackathon teams work? Can I register alone?",
    answer:
      "Hackathon teams can have between 1 to 4 members. You can apply as a pre-formed team or apply as an individual. We will host a dedicated team-matching session before hacking begins.",
  },
  {
    id: "hardware",
    question: "Do I need a special laptop or hardware?",
    answer:
      "Any standard laptop running macOS, Linux, or Windows with a modern browser and Python 3.10+ is all you need. Quantum circuits execute remotely on IBM Quantum cloud hardware via Qiskit Runtime.",
  },
  {
    id: "external",
    question: "Can students from universities other than BITS Pilani apply?",
    answer:
      "Yes! BITS Qiskit Fall Fest 2026 welcomes student participants from universities across the region. Hybrid livestream access will also be provided for selected keynote sessions.",
  },
];

