import test from "node:test";
import assert from "node:assert/strict";
import { InMemoryEmailDeliveryRepository } from "../../application/email-test-helpers";

test("repository claim uses state version to prevent duplicate ownership", async () => {
  const repository = new InMemoryEmailDeliveryRepository();
  const now = new Date("2026-05-22T00:00:00.000Z");
  const delivery = await repository.createOrReuseDelivery({
    request: {
      category: "system_test",
      idempotencyKey: "repo-claim",
      to: "learner@example.com",
      subject: "Claim",
      text: "Body",
    },
    normalizedRecipient: "learner@example.com",
    from: "info@scholar-x.org",
    recipientHash: "hash",
    subjectHash: "subject",
    subjectPreview: "Claim",
    now,
  });

  const first = await repository.claimDeliveryForSending({
    deliveryId: delivery.id,
    workerId: "w1",
    lockedUntil: new Date(now.getTime() + 120_000),
    expectedStateVersion: delivery.stateVersion,
  });
  const second = await repository.claimDeliveryForSending({
    deliveryId: delivery.id,
    workerId: "w2",
    lockedUntil: new Date(now.getTime() + 120_000),
    expectedStateVersion: delivery.stateVersion,
  });

  assert.ok(first);
  assert.equal(second, null);
});
