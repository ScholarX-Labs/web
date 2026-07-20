"use client";

import { useState } from "react";
import { useEnrollUserWithPayment } from "@/hooks/admin/use-admin-enrollments";
import { PAYMENT_METHODS } from "@/domain/admin/contracts/admin-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface EnrollUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
}

export function EnrollUserModal({ open, onOpenChange, courseId }: EnrollUserModalProps) {
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [paymentId, setPaymentId] = useState("");

  const enrollUser = useEnrollUserWithPayment();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await enrollUser.mutateAsync({
      courseId,
      data: {
        email,
        amount: Math.round(parseFloat(amount) * 100),
        paymentMethod,
        paymentId: paymentId || undefined,
      },
    });
    handleClose();
  };

  const handleClose = () => {
    setEmail("");
    setAmount("");
    setPaymentMethod("");
    setPaymentId("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Enroll User</DialogTitle>
            <DialogDescription>
              Enroll an existing user in this course with payment tracking.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {enrollUser.isError && (
              <Alert variant="destructive">
                <AlertCircle className="size-4" />
                <AlertDescription>
                  {enrollUser.error?.message || "Failed to enroll user."}
                </AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">User Email *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (USD) *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Payment Method *</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((method) => (
                      <SelectItem key={method} value={method}>
                        {method.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentId">Payment Reference ID</Label>
              <Input
                id="paymentId"
                value={paymentId}
                onChange={(e) => setPaymentId(e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={enrollUser.isPending || !paymentMethod}>
              {enrollUser.isPending ? "Enrolling..." : "Enroll"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
