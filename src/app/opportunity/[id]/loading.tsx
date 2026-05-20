export default function OpportunityLoading() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12 animate-pulse">
      <div className="h-6 w-24 rounded-full bg-muted" />
      <div className="mt-6 h-10 w-3/4 rounded-lg bg-muted" />
      <div className="mt-4 space-y-3">
        <div className="h-4 w-full rounded bg-muted" />
        <div className="h-4 w-11/12 rounded bg-muted" />
        <div className="h-4 w-10/12 rounded bg-muted" />
      </div>
      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="h-20 rounded-2xl bg-muted" />
        <div className="h-20 rounded-2xl bg-muted" />
        <div className="h-20 rounded-2xl bg-muted" />
        <div className="h-20 rounded-2xl bg-muted" />
      </div>
      <div className="mt-12 h-32 rounded-2xl bg-muted" />
    </div>
  );
}
