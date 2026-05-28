import { incrementDeliveryCounter } from "./telemetry";

export async function dispatchFailOpen(
  action: () => Promise<void>,
  context: string,
): Promise<boolean> {
  try {
    await action();
    incrementDeliveryCounter(context, "success");
    return true;
  } catch (error) {
    incrementDeliveryCounter(context, "failure");
    const errorName = error instanceof Error ? error.name : "UnknownError";
    const errorMessage = error instanceof Error
      ? error.message
      : "Unknown analytics dispatch failure";
    console.warn("analytics.dispatchFailOpen: non-blocking failure", {
      context,
      errorName,
      errorMessage,
    });
    return false;
  }
}
