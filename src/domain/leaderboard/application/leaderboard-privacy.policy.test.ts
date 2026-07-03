import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { LeaderboardPrivacyPolicy } from "./leaderboard-privacy.policy";
import { LeaderboardEntryDto } from "../contracts/leaderboard.types";

describe("LeaderboardPrivacyPolicy", () => {
  const policy = new LeaderboardPrivacyPolicy();
  const baseEntry: LeaderboardEntryDto = {
    rank: 1,
    displayName: "John Doe",
    avatarUrl: "https://example.com/avatar.png",
    totalScore: 100,
    isCurrentUser: false,
    isPrivate: true,
  };

  it("should bypass masking for admin users", () => {
    const result = policy.mask(baseEntry, true);
    assert.equal(result.displayName, "John Doe");
    assert.equal(result.avatarUrl, "https://example.com/avatar.png");
  });

  it("should bypass masking for the user viewing their own score", () => {
    const ownEntry = { ...baseEntry, isCurrentUser: true };
    const result = policy.mask(ownEntry, false);
    assert.equal(result.displayName, "John Doe");
  });

  it("should mask for peer view if user is opted out", () => {
    const result = policy.mask(baseEntry, false);
    assert.equal(result.displayName, "Anonymous Learner");
    assert.equal(result.avatarUrl, null);
  });

  it("should passthrough if the user is public", () => {
    const publicEntry = { ...baseEntry, isPrivate: false };
    const result = policy.mask(publicEntry, false);
    assert.equal(result.displayName, "John Doe");
    assert.equal(result.avatarUrl, "https://example.com/avatar.png");
  });
});
