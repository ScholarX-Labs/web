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
    console.warn("analytics.dispatchFailOpen: non-blocking failure", {
      context,
      error,
    });
    return false;
  }
}
