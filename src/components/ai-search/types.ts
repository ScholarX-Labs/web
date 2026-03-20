export type OpportunityType =
  | "scholarship"
  | "conference"
  | "prize"
  | "internship"
  | "fellowship";

export interface Opportunity {
  id: string;
  type: OpportunityType;
  title: string;
  subtitle: string;
  description: string;
  aiReason: string;
  country: string;
  deadline: string;
  fundingLabel: string;
  remote?: boolean;
  matchScore: number;
}

export interface AiChatMessage {
  id: string;
  role: "assistant" | "user";
  text: string;
  opportunities?: Opportunity[];
}
