import { RegisteredEventsTable } from "./registered-events-table";
import type { RegisteredEventRow } from "@/domain/executive/contracts/executive-read-repository.contract";

export type EventImpactTableProps = {
  rows: readonly RegisteredEventRow[];
  totalRegistrations: number;
};

export function EventImpactTable({ rows, totalRegistrations }: EventImpactTableProps) {
  return (
    <section aria-label="Event registrations">
      <RegisteredEventsTable rows={rows} totalRegistrations={totalRegistrations} />
    </section>
  );
}
