import { AiChatMessage, Opportunity } from "@/components/ai-search/types";

export const MOCK_OPPORTUNITIES: Opportunity[] = [
  {
    id: "opp-1",
    type: "scholarship",
    title: "Fulbright Scholar Program 2026-2027",
    subtitle: "International Exchange",
    description:
      "One of the most prestigious international exchange programs for study, teaching, and research.",
    aiReason:
      "Highest-ranked scholarship for graduate-level academic excellence and research potential.",
    country: "USA",
    deadline: "Apr 1, 2026",
    fundingLabel: "Fully Funded",
    matchScore: 96,
  },
  {
    id: "opp-2",
    type: "conference",
    title: "UNESCO World Heritage Forum 2026",
    subtitle: "Workshop",
    description:
      "Global conference where young professionals discuss heritage, policy, and innovation.",
    aiReason:
      "Excellent fit for students interested in culture, heritage, and international affairs.",
    country: "South Korea",
    deadline: "Mar 15, 2026",
    fundingLabel: "Fully Funded",
    matchScore: 95,
  },
  {
    id: "opp-3",
    type: "prize",
    title: "UNEP Young Champions of the Earth 2026",
    subtitle: "Global Prize",
    description:
      "UN flagship award supporting bold, world-changing environmental ideas from young founders.",
    aiReason:
      "Great match for environmentally motivated candidates with innovative ideas.",
    country: "USA",
    deadline: "Mar 31, 2026",
    fundingLabel: "Fully Funded",
    remote: true,
    matchScore: 91,
  },
  {
    id: "opp-4",
    type: "internship",
    title: "Green Climate Fund Internship 2026",
    subtitle: "South Korea",
    description:
      "Six-month paid internship with health insurance, stipend, and round-trip airfare.",
    aiReason:
      "Top pick for students in environmental policy and sustainability studies.",
    country: "South Korea",
    deadline: "Mar 20, 2026",
    fundingLabel: "Fully Funded",
    matchScore: 87,
  },
  {
    id: "opp-5",
    type: "conference",
    title: "Just Peace Summit 2026",
    subtitle: "London",
    description:
      "International summit focused on peace-building, education, and community resilience.",
    aiReason:
      "Ideal for high school and undergraduate applicants focused on social impact.",
    country: "UK",
    deadline: "Mar 19, 2026",
    fundingLabel: "Fully Funded",
    matchScore: 82,
  },
  {
    id: "opp-6",
    type: "fellowship",
    title: "ITLOS Nippon Foundation Training Program",
    subtitle: "Germany",
    description:
      "Nine-month fellowship in maritime law and ocean governance with global experts.",
    aiReason:
      "Strong fit for legal and policy tracks focused on marine and environmental law.",
    country: "Germany",
    deadline: "Mar 6, 2026",
    fundingLabel: "Fully Funded",
    matchScore: 78,
  },
];

export const INITIAL_MESSAGES: AiChatMessage[] = [
  {
    id: "m-1",
    role: "assistant",
    text: "Hello! I am your AI Opportunity Assistant. Share your field, country preferences, and funding needs, and I will find your best matches.",
  },
];
