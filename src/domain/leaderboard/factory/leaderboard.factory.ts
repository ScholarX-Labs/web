import {
  LeaderboardService,
  LeaderboardQueryService,
  LeaderboardCacheRebuildJob,
  LeaderboardScoringPolicy,
  LeaderboardPrivacyPolicy,
} from "../application";
import {
  PointEventRepository,
  LeaderboardCacheRepository,
  LeaderboardOptOutRepository,
} from "../infrastructure";

export interface LeaderboardDomainServices {
  command: LeaderboardService;
  query: LeaderboardQueryService;
  rebuildJob: LeaderboardCacheRebuildJob;
}

export const createLeaderboardDomain = (): LeaderboardDomainServices => {
  const pointEventRepo = new PointEventRepository();
  const cacheRepo = new LeaderboardCacheRepository();
  const optOutRepo = new LeaderboardOptOutRepository();

  const scoringPolicy = new LeaderboardScoringPolicy();
  const privacyPolicy = new LeaderboardPrivacyPolicy();

  const rebuildJob = new LeaderboardCacheRebuildJob(
    pointEventRepo,
    cacheRepo,
    scoringPolicy
  );

  return {
    command: new LeaderboardService(pointEventRepo, optOutRepo, rebuildJob),
    query: new LeaderboardQueryService(
      cacheRepo,
      optOutRepo,
      pointEventRepo,
      privacyPolicy
    ),
    rebuildJob,
  };
};
