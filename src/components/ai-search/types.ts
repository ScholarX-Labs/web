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
  applicationLink?: string | null;
}

export interface AiChatMessage {
  id: string;
  role: "assistant" | "user";
  text: string;
  opportunities?: Opportunity[];
}
