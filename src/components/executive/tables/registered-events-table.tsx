import type { RegisteredEventRow } from "@/domain/executive/contracts/executive-read-repository.contract";

export type RegisteredEventsTableProps = {
  rows: readonly RegisteredEventRow[];
  totalRegistrations: number;
};

const percent = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 1,
});

const number = new Intl.NumberFormat("en-US");

/**
 * Renders the registered-events table for the Opportunities & AI page.
 *
 * US12 AC2: When `attendanceState === "data_gap"` (i.e. the event platform did
 * not ship attendance data), attendance columns render "—" rather than "0%".
 * This prevents the community lead from misreading zero-attendance as a fact.
 */
export function RegisteredEventsTable({
  rows,
  totalRegistrations,
}: RegisteredEventsTableProps) {
  return (
    <section
      className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
      aria-labelledby="registered-events-heading"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2
            id="registered-events-heading"
            className="text-sm font-semibold text-slate-950"
          >
            Registered events
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {number.format(totalRegistrations)} total registrations from{" "}
            {number.format(rows.length)} event
            {rows.length === 1 ? "" : "s"}
          </p>
        </div>
        <span className="text-xs font-medium uppercase text-slate-400">
          {rows.length} events
        </span>
      </div>

      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">
          No event registrations recorded for this period.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table
            id="registered-events-table"
            className="w-full min-w-[700px] text-left text-sm"
          >
            <thead className="text-xs uppercase text-slate-400">
              <tr className="border-b border-slate-100">
                <th className="py-2 pr-3 font-semibold">Event</th>
                <th className="py-2 pr-3 font-semibold">Registrations</th>
                <th className="py-2 pr-3 font-semibold">
                  Attendance
                  <AttendanceTooltip />
                </th>
                <th className="py-2 pr-3 font-semibold">No-show rate</th>
                <th className="py-2 pr-3 font-semibold">Post-event signups</th>
                <th className="py-2 pr-3 font-semibold">Post-event enrols</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.eventId}>
                  <td className="py-3 pr-3 font-medium text-slate-950 break-all">
                    {row.title}
                  </td>
                  <td className="py-3 pr-3 text-slate-700">
                    {number.format(row.registrations)}
                  </td>
                  <td className="py-3 pr-3 text-slate-600">
                    {row.attendanceState === "data_gap" ? (
                      <DataGapPill label="Not tracked" />
                    ) : (
                      number.format(row.attendees ?? 0)
                    )}
                  </td>
                  <td className="py-3 pr-3 text-slate-600">
                    {row.noShowRate === null ? (
                      <DataGapPill label="—" />
                    ) : (
                      percent.format(row.noShowRate)
                    )}
                  </td>
                  <td className="py-3 pr-3 text-slate-600">
                    {row.postEventSignupConversionRate === null ? (
                      <span className="text-slate-400">—</span>
                    ) : (
                      percent.format(row.postEventSignupConversionRate)
                    )}
                  </td>
                  <td className="py-3 pr-3 text-slate-600">
                    {row.postEventEnrollmentConversionRate === null ? (
                      <span className="text-slate-400">—</span>
                    ) : (
                      percent.format(row.postEventEnrollmentConversionRate)
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function DataGapPill({ label }: { label: string }) {
  return (
    <span
      className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium bg-slate-100 text-slate-500"
      title="Attendance data was not available for this event."
    >
      {label}
    </span>
  );
}

function AttendanceTooltip() {
  return (
    <span
      className="ml-1 inline-block cursor-default text-slate-400"
      title="Attendance is only tracked when the event platform sends us check-in data. 'Not tracked' means no data was received — not that attendance was zero."
      aria-label="Attendance tracking note"
    >
      ⓘ
    </span>
  );
}
