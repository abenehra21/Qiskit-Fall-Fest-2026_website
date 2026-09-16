export interface FAQItem {
  question: string;
  answer: string;
}

export const faqs: FAQItem[] = [
  {
    question: "Is registration really completely free?",
    answer:
      "Yes. Workshops, talks, hackathon entry and IBM Quantum hardware access cost nothing for registered students. IBM Quantum is a partner of the fest.",
  },
  {
    question: "Do I need prior quantum computing experience?",
    answer:
      "No. The workshops build from the fundamentals. If you can write basic Python and you have seen matrices and vectors in a first-year maths course, you have enough to follow along and write circuits that run.",
  },
  {
    question: "How do hackathon teams work? Can I register alone?",
    answer:
      "Teams are one to four people. Register alone or as a formed team — there is a team-matching session before hacking starts.",
  },
  {
    question: "Do I need a special laptop or hardware?",
    answer:
      "Any laptop running macOS, Linux or Windows, with a current browser and Python 3.10 or later. The circuits execute on IBM's machines through Qiskit Runtime, so nothing demanding runs locally.",
  },
  {
    question: "Can students from universities other than BITS Pilani apply?",
    answer:
      "Yes, the fest is open to students from any university. Register for either format: on campus, or online with access to every talk.",
  },
];
