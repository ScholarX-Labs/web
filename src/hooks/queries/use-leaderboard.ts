import { useQuery } from "@tanstack/react-query";
import { LeaderboardWindow, LeaderboardEntryDto, MyRankDto } from "@/domain/leaderboard/contracts/leaderboard.types";

interface LeaderboardData {
  entries: LeaderboardEntryDto[];
  updatedAt: Date | null;
}

interface LeaderboardApiResponse {
  entries: LeaderboardEntryDto[];
  updatedAt: string | null;
}

export function useLeaderboardEntries(courseId: string, window: LeaderboardWindow, initialData?: LeaderboardData) {
  return useQuery({
    queryKey: ["leaderboard", courseId, window, "entries"],
    queryFn: async (): Promise<LeaderboardData> => {
      const res = await fetch(`/api/leaderboard/${courseId}?window=${window}`);
      if (!res.ok) throw new Error("Failed to fetch leaderboard");
      const data: LeaderboardApiResponse = await res.json();
      return {
        entries: data.entries,
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : null,
      };
    },
    initialData: window === "all" ? initialData : undefined,
    staleTime: 60 * 1000,
  });
}

export function useLeaderboardMyRank(courseId: string, window: LeaderboardWindow, initialData?: MyRankDto | null) {
  return useQuery({
    queryKey: ["leaderboard", courseId, window, "myRank"],
    queryFn: async (): Promise<MyRankDto | null> => {
      const res = await fetch(`/api/leaderboard/${courseId}/me?window=${window}`);
      if (!res.ok) {
        if (res.status === 401) return null; // Not logged in
        throw new Error("Failed to fetch your rank");
      }
      const data: unknown = await res.json();
      return data as MyRankDto;
    },
    initialData: window === "all" ? initialData : undefined,
    staleTime: 60 * 1000,
  });
}
