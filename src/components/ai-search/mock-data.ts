import { AiChatMessage } from "./types";

export const INITIAL_MESSAGES: AiChatMessage[] = [
  {
    id: "welcome",
    role: "assistant",
    text: "Hi! I'm your ScholarX AI Assistant. I can help you find scholarships, internships, and other opportunities based on your skills and interests. What are you looking for today?",
  },
];

export const MOCK_OPPORTUNITIES = [
  {
    id: "opp-1",
    type: "scholarship",
    title: "Global Excellence Scholarship",
    subtitle: "London, UK",
    description: "Fully funded scholarship for international students pursuing postgraduate studies in Engineering or Data Science.",
    aiReason: "Matches your interest in international postgraduate studies.",
    country: "UK",
    deadline: "June 15, 2026",
    fundingLabel: "Fully Funded",
    matchScore: 94,
  },
  {
    id: "opp-2",
    type: "internship",
    title: "Software Engineering Intern",
    subtitle: "Remote / San Francisco",
    description: "12-week summer internship program at a leading tech company focusing on distributed systems.",
    aiReason: "Based on your technical background in backend systems.",
    country: "USA",
    deadline: "Rolling",
    fundingLabel: "Paid",
    remote: true,
    matchScore: 88,
  },
];
