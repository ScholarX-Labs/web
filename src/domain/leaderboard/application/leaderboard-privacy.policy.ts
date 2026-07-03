import { LeaderboardEntryDto } from "../contracts/leaderboard.types";

export class LeaderboardPrivacyPolicy {
  /**
   * Masks the identity of opted-out users for non-admin viewers.
   * If the entry belongs to the current user, it is never masked.
   * If the viewer is an admin, it is never masked.
   * Otherwise, if the entry is private, displayName and avatarUrl are masked.
   */
  public mask(entry: LeaderboardEntryDto, isAdmin: boolean): LeaderboardEntryDto {
    if (isAdmin || entry.isCurrentUser || !entry.isPrivate) {
      return entry;
    }

    return {
      ...entry,
      displayName: "Anonymous Learner",
      avatarUrl: null,
    };
  }
}
