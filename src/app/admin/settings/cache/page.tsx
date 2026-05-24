import { Activity, AlertTriangle, Database, ShieldCheck } from "lucide-react";
import { env } from "@/config/env";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getServerCacheStatus } from "@/lib/cache/cache.factory";

export const dynamic = "force-dynamic";

function readCount(
  counts: Record<string, number>,
  key: string,
): number {
  return counts[key] ?? 0;
}

function formatTimestamp(value: string | null): string {
  if (!value) return "Never";
  return new Date(value).toLocaleString();
}

export default async function AdminCacheSettingsPage() {
  const status = getServerCacheStatus();
  const { counts } = status.metrics;

  const cacheHits = readCount(counts, "cache:get:hit");
  const cacheMisses = readCount(counts, "cache:get:miss");
  const cacheFallbacks = readCount(counts, "cache:get:fallback");
  const rateLimitFallbacks = readCount(counts, "rate-limit:check:fallback");
  const redisErrors = readCount(counts, "redis:availability:error");
  const circuitOpens = readCount(counts, "redis:circuit:circuit_open");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Cache Diagnostics</h1>
        <p className="text-muted-foreground mt-1">
          Shared Redis availability, fallback activity, and rate-limit health.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Circuit State"
          value={status.circuitOpen ? "Open" : "Closed"}
          description={`Cooldown ${Math.round(status.circuitCooldownMs / 1000)}s`}
          icon={status.circuitOpen ? AlertTriangle : ShieldCheck}
          tone={status.circuitOpen ? "warning" : "ok"}
        />
        <MetricCard
          title="Cache Reads"
          value={cacheHits.toLocaleString()}
          description={`${cacheMisses.toLocaleString()} misses`}
          icon={Database}
          tone="default"
        />
        <MetricCard
          title="Cache Fallbacks"
          value={cacheFallbacks.toLocaleString()}
          description="Memory adapter or bypass path"
          icon={Activity}
          tone={cacheFallbacks > 0 ? "warning" : "default"}
        />
        <MetricCard
          title="Limiter Fallbacks"
          value={rateLimitFallbacks.toLocaleString()}
          description="Distributed limits unavailable"
          icon={ShieldCheck}
          tone={rateLimitFallbacks > 0 ? "warning" : "default"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Redis Status</CardTitle>
            <CardDescription>
              Current process view of the shared Redis circuit and error history.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <StatusRow label="Cache enabled" value={env.CACHE_ENABLED !== "false" ? "Yes" : "No"} />
            <StatusRow
              label="Distributed limits enabled"
              value={env.DISTRIBUTED_RATE_LIMITS_ENABLED !== "false" ? "Yes" : "No"}
            />
            <StatusRow
              label="Redis configured"
              value={status.configured ? "Yes" : "No"}
            />
            <StatusRow label="Redis provider" value={status.provider} />
            <StatusRow label="Circuit open" value={status.circuitOpen ? "Yes" : "No"} />
            <StatusRow
              label="Consecutive failures"
              value={status.consecutiveFailures.toLocaleString()}
            />
            <StatusRow
              label="Last failure context"
              value={status.lastFailureContext ?? "None"}
            />
            <StatusRow
              label="Last failure at"
              value={formatTimestamp(status.lastFailureAt)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Event Counters</CardTitle>
            <CardDescription>
              Rolling in-process counters since this instance booted.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <StatusRow label="Redis errors" value={redisErrors.toLocaleString()} />
            <StatusRow label="Circuit opens" value={circuitOpens.toLocaleString()} />
            <StatusRow label="Cache hits" value={cacheHits.toLocaleString()} />
            <StatusRow label="Cache misses" value={cacheMisses.toLocaleString()} />
            <StatusRow
              label="Rate-limit fallbacks"
              value={rateLimitFallbacks.toLocaleString()}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Metric Events</CardTitle>
          <CardDescription>
            Latest 200 cache and limiter events retained by this application instance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status.metrics.recentEvents.length === 0 ? (
            <p className="text-muted-foreground text-sm">No events recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="text-muted-foreground border-b text-left">
                  <tr>
                    <th className="px-3 py-2 font-medium">Time</th>
                    <th className="px-3 py-2 font-medium">Source</th>
                    <th className="px-3 py-2 font-medium">Operation</th>
                    <th className="px-3 py-2 font-medium">Outcome</th>
                    <th className="px-3 py-2 font-medium">Context</th>
                  </tr>
                </thead>
                <tbody>
                  {[...status.metrics.recentEvents]
                    .reverse()
                    .slice(0, 25)
                    .map((event) => (
                      <tr key={`${event.timestamp}-${event.source}-${event.operation}-${event.outcome}-${event.context ?? ""}`} className="border-b last:border-b-0">
                        <td className="px-3 py-2 whitespace-nowrap">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="px-3 py-2">{event.source}</td>
                        <td className="px-3 py-2">{event.operation}</td>
                        <td className="px-3 py-2">{event.outcome}</td>
                        <td className="px-3 py-2 break-all text-xs text-slate-600">
                          {event.context ?? "-"}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatusRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b pb-3 last:border-b-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="max-w-[60%] text-right font-medium break-all">{value}</span>
    </div>
  );
}

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  tone,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "default" | "ok" | "warning";
}) {
  const iconTone =
    tone === "ok"
      ? "bg-emerald-100 text-emerald-700"
      : tone === "warning"
        ? "bg-amber-100 text-amber-700"
        : "bg-slate-100 text-slate-700";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className={`flex size-10 items-center justify-center rounded-lg ${iconTone}`}>
            <Icon className="size-5" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold tracking-tight">{value}</p>
      </CardContent>
    </Card>
  );
}
