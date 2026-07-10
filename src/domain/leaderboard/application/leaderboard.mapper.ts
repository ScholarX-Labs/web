import {
  LeaderboardEntryDto,
  RawLeaderboardEntry,
} from "../contracts/leaderboard.types";

export function mapRawEntryToDto(
  raw: RawLeaderboardEntry,
  currentUserId: string,
  isPrivate: boolean = false
): LeaderboardEntryDto {
  return {
    rank: raw.rank,
    displayName: "", // This will be hydrated by query service or masked by privacy policy
    avatarUrl: null,
    totalScore: raw.totalScore,
    isCurrentUser: raw.userId === currentUserId,
    isPrivate,
  };
}
