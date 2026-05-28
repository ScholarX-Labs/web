import { ANALYTICS_EVENTS } from "@/lib/executive/analytics/constants";
import { trackClientEvent } from "@/lib/executive/analytics/client";

export function trackOpportunitySave(opportunityId: string, source: string): void {
  void trackClientEvent({
    event: ANALYTICS_EVENTS.OPPORTUNITY_SAVE,
    properties: {
      opportunity_id: opportunityId,
      source,
    },
  });
}

export function trackOpportunityApplyClick(opportunityId: string, source: string): void {
  void trackClientEvent({
    event: ANALYTICS_EVENTS.OPPORTUNITY_APPLY_CLICK,
    properties: {
      opportunity_id: opportunityId,
      apply_target_type: "external_link",
      source,
    },
  });
}

