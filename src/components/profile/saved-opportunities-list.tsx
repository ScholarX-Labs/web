"use client";

import { Heart } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/routes";

export function SavedOpportunitiesList() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Saved Opportunities</CardTitle>
        <CardDescription>Opportunities you&apos;ve bookmarked for later.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4 py-12">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Heart className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="text-center">
          <p className="font-medium text-foreground">No saved opportunities yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Discover programs, scholarships, and events that match your interests.
          </p>
        </div>
        <Button asChild>
          <Link href={ROUTES.OPPORTUNITIES}>Discover Opportunities</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
