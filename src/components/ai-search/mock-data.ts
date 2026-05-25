import { AiChatMessage, Opportunity } from "@/components/ai-search/types";

export const MOCK_OPPORTUNITIES: Opportunity[] = [
  {
    id: "1",
    type: "scholarship",
    title: "Fulbright Foreign Student Program",
    subtitle: "United States",
    description:
      "Fully funded scholarships for graduate study in the US. Open to all fields of study.",
    aiReason: "High match based on your academic profile.",
    country: "USA",
    deadline: "Oct 10, 2025",
    fundingLabel: "Fully Funded",
    matchScore: 95,
  },
  {
    id: "2",
    type: "internship",
    title: "Google STEP Internship",
    subtitle: "Remote / Global",
    description:
      "A paid internship program for first and second-year university students interested in tech.",
    aiReason: "Matches your interest in computer science.",
    country: "Global",
    deadline: "Feb 15, 2025",
    fundingLabel: "Paid",
    matchScore: 88,
  },
];

export const INITIAL_MESSAGES: AiChatMessage[] = [
  {
    id: "welcome",
    role: "assistant",
    text: "Hi! I'm your ScholarX AI assistant. Ask me about scholarships, internships, fellowships, or conferences matching your profile.",
  },
];
