export interface PublicProfile {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  image: string | null;
  educationLevel: string | null;
  university: string | null;
  faculty: string | null;
  currentInterest: string | null;
  githubUrl: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  twitterUrl: string | null;
  linkedinUrl: string | null;
}

export interface EnrolledCourse {
  id: string;
  title: string;
  thumbnail: string;
  instructor: { name: string; avatar: string | null };
  progress: number;
  slug: string;
  lastAccessedAt: string | null;
}

export interface Certificate {
  id: string;
  courseName: string;
  issueDate: string;
  credentialId: string;
  downloadUrl: string;
}

export interface SavedOpportunity {
  id: string;
  title: string;
  organization: string;
  location: string | null;
  type: string;
  savedAt: string;
}

export interface ProfileCompletion {
  percentage: number;
  missingFields: string[];
}

export interface ActionResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string | Record<string, string[]>;
}

export type SocialPlatform =
  | "github"
  | "facebook"
  | "instagram"
  | "twitter"
  | "linkedin";

export const SOCIAL_PLATFORMS: Record<
  SocialPlatform,
  { color: string; label: string }
> = {
  github: { color: "#181717", label: "GitHub" },
  facebook: { color: "#1877F2", label: "Facebook" },
  instagram: {
    color:
      "linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)",
    label: "Instagram",
  },
  twitter: { color: "#000000", label: "X (Twitter)" },
  linkedin: { color: "#0A66C2", label: "LinkedIn" },
};
