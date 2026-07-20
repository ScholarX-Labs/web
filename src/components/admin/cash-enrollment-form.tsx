"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCashEnrollment } from "@/hooks/admin/use-admin-enrollments";
import { adminApi } from "@/lib/admin/admin-api-client";
import { PAYMENT_METHODS } from "@/domain/admin/contracts/admin-types";
import { PasswordDisplay } from "@/components/admin/password-display";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  User,
  CreditCard,
} from "lucide-react";

export function CashEnrollmentForm() {
  const [step, setStep] = useState<1 | 2>(1);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [courseId, setCourseId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [paymentId, setPaymentId] = useState("");

  const cashEnrollment = useCashEnrollment();

  const { data: coursesData } = useQuery({
    queryKey: ["admin", "courses-for-enrollment"],
    queryFn: () => adminApi.courses.list({ limit: 100, status: "active" }),
  });

  const courses = ((coursesData as { items?: { id: string; title: string }[] })?.items ?? []);

  const handleNext = () => {
    if (step === 1) setStep(2);
  };

  const handleBack = () => {
    if (step === 2) setStep(1);
  };

  const handleSubmit = async () => {
    await cashEnrollment.mutateAsync({
      user: {
        firstName,
        lastName,
        email,
        phoneNumber: phoneNumber || undefined,
      },
      course: {
        courseId,
        paymentMethod,
        amount: Math.round(parseFloat(amount) * 100),
        paymentId: paymentId || undefined,
      },
    });
    setStep(1);
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhoneNumber("");
    setCourseId("");
    setAmount("");
    setPaymentMethod("");
    setPaymentId("");
  };

  if (cashEnrollment.isSuccess && cashEnrollment.data) {
    const data = cashEnrollment.data;
    return (
      <Card className="p-8 text-center space-y-6">
        <CheckCircle2 className="size-16 text-green-600 mx-auto" />
        <div>
          <h3 className="text-xl font-bold">Enrollment Complete</h3>
          <p className="text-muted-foreground mt-1">
            {data.user.firstName} {data.user.lastName} has been enrolled in {data.course.title}.
          </p>
        </div>
        {data.password && (
          <div className="space-y-2 max-w-sm mx-auto">
            <Label className="text-sm font-medium">Temporary Password</Label>
            <PasswordDisplay password={data.password} />
            <p className="text-xs text-muted-foreground">
              Share this password with the user. They must change it on first login.
            </p>
          </div>
        )}
        <Button onClick={() => cashEnrollment.reset()}>Create Another Enrollment</Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className={`flex items-center gap-2 ${step === 1 ? "text-blue-600" : "text-green-600"}`}>
          <div className={`size-8 rounded-full flex items-center justify-center text-sm font-bold ${step === 1 ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
            <User className="size-4" />
          </div>
          <span className="text-sm font-medium">User Info</span>
        </div>
        <ArrowRight className="size-4 text-muted-foreground" />
        <div className={`flex items-center gap-2 ${step === 2 ? "text-blue-600" : "text-muted-foreground"}`}>
          <div className={`size-8 rounded-full flex items-center justify-center text-sm font-bold ${step === 2 ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-400"}`}>
            <CreditCard className="size-4" />
          </div>
          <span className="text-sm font-medium">Payment</span>
        </div>
      </div>

      {cashEnrollment.isError && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>
            {cashEnrollment.error?.message || "Failed to process enrollment."}
          </AlertDescription>
        </Alert>
      )}

      {step === 1 && (
        <Card className="p-6 space-y-4">
          <h3 className="font-semibold">User Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input id="phoneNumber" type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleNext} disabled={!firstName || !lastName || !email}>
              Next <ArrowRight className="size-4 ml-2" />
            </Button>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card className="p-6 space-y-4">
          <h3 className="font-semibold">Course & Payment</h3>
          <div className="space-y-2">
            <Label>Course *</Label>
            <Select value={courseId} onValueChange={setCourseId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (USD) *</Label>
              <Input id="amount" type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Payment Method *</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m} value={m}>{m.replace("_", " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="paymentId">Payment Reference ID</Label>
            <Input id="paymentId" value={paymentId} onChange={(e) => setPaymentId(e.target.value)} placeholder="Optional" />
          </div>
          <div className="flex justify-between">
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="size-4 mr-2" /> Back
            </Button>
            <Button onClick={handleSubmit} disabled={!courseId || !amount || !paymentMethod || cashEnrollment.isPending}>
              {cashEnrollment.isPending ? "Processing..." : "Complete Enrollment"}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
