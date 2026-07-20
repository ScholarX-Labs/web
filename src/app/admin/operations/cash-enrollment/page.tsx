import { CashEnrollmentForm } from "@/components/admin/cash-enrollment-form";

export default function CashEnrollmentPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Cash Enrollment</h1>
        <p className="text-muted-foreground mt-1">
          Create a new user and enroll them in a course in one step
        </p>
      </div>
      <CashEnrollmentForm />
    </div>
  );
}
