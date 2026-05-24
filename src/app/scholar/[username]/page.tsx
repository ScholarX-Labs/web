import { cache } from "react";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPublicProfile } from "@/actions/public-profile.actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SocialIconLink } from "@/components/profile/social-icon-link";
import { checkPublicProfileLimit } from "@/lib/rate-limiter";
import { getClientIpFromHeaders } from "@/lib/request-ip";
import type { PublicProfile, SocialPlatform } from "@/types/profile.types";
import { GraduationCap, Building2, Bookmark } from "lucide-react";

interface Props {
  params: Promise<{ username: string }>;
}

type ProfilePageData =
  | { kind: "ok"; profile: PublicProfile }
  | { kind: "not_found" }
  | { kind: "rate_limited"; retryAfter: number };

const getProfilePageData = cache(async (username: string, callerIp: string | null) => {
  if (callerIp) {
    const rateLimit = await checkPublicProfileLimit(callerIp);
    if (!rateLimit.allowed) {
      return {
        kind: "rate_limited",
        retryAfter: Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000)),
      } satisfies ProfilePageData;
    }
  }

  const profile = await getPublicProfile(username);
  return profile
    ? ({ kind: "ok", profile } satisfies ProfilePageData)
    : ({ kind: "not_found" } satisfies ProfilePageData);
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const callerIp = getClientIpFromHeaders(await headers());
  const result = await getProfilePageData(username, callerIp);

  if (result.kind === "rate_limited") {
    return {
      title: "Too many requests - ScholarX Profile",
      robots: { index: false, follow: false },
    };
  }

  if (result.kind === "not_found") return {};

  const { profile } = result;

  const fullName = `${profile.firstName} ${profile.lastName}`;

  return {
    title: `${fullName} (@${profile.username}) — ScholarX Profile`,
    description: `${fullName}${profile.currentInterest ? ` — ${profile.currentInterest}` : ""}${profile.educationLevel ? `, ${profile.educationLevel}` : ""}${profile.university ? ` at ${profile.university}` : ""}`,
    openGraph: {
      title: fullName,
      description: profile.currentInterest ?? `View ${fullName}'s profile on ScholarX`,
      type: "profile",
      images: profile.image ? [{ url: profile.image }] : [],
    },
  };
}

export default async function PublicProfilePage({ params }: Props) {
  const { username } = await params;
  const callerIp = getClientIpFromHeaders(await headers());
  const result = await getProfilePageData(username, callerIp);

  if (result.kind === "rate_limited") {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-3 px-4 py-16 md:px-8">
        <h1 className="text-2xl font-semibold text-foreground">
          Too many profile requests
        </h1>
        <p className="text-sm text-muted-foreground">
          Please retry in {result.retryAfter} seconds.
        </p>
      </div>
    );
  }

  if (result.kind === "not_found") {
    notFound();
  }

  const { profile } = result;
  const initials = `${profile.firstName?.charAt(0) ?? ""}${profile.lastName?.charAt(0) ?? ""}`.toUpperCase();
  const fullName = `${profile.firstName} ${profile.lastName}`;

  const socialLinks: { platform: SocialPlatform; url: string | null }[] = [
    { platform: "github", url: profile.githubUrl },
    { platform: "linkedin", url: profile.linkedinUrl },
    { platform: "facebook", url: profile.facebookUrl },
    { platform: "twitter", url: profile.twitterUrl },
    { platform: "instagram", url: profile.instagramUrl },
  ];

  const hasSocialLinks = socialLinks.some((l) => l.url);

  return (
    <div className="mx-auto flex max-w-4xl flex-col items-center gap-8 px-4 py-12 md:px-8">
      {/* Profile Header */}
      <div className="flex flex-col items-center gap-4 text-center">
        <Avatar className="h-28 w-28 border-4 border-border shadow-lg">
          <AvatarImage src={profile.image ?? undefined} alt={fullName} />
          <AvatarFallback className="bg-muted text-2xl font-medium">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-3xl font-bold text-foreground">{fullName}</h1>
          <p className="text-sm text-muted-foreground">@{profile.username}</p>
        </div>
      </div>

      {/* Social Links */}
      {hasSocialLinks && (
        <div className="flex items-center gap-3">
          {socialLinks.map(
            (link) =>
              link.url && (
                <SocialIconLink
                  key={link.platform}
                  platform={link.platform}
                  url={link.url}
                  size={24}
                />
              )
          )}
        </div>
      )}

      <Separator className="max-w-md" />

      {/* Info Cards */}
      <div className="grid w-full gap-4 md:grid-cols-2">
        {(profile.educationLevel || profile.university || profile.faculty) && (
          <Card>
            <CardContent className="flex flex-col gap-3 p-5">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <GraduationCap className="h-4 w-4" />
                Education
              </div>
              {profile.educationLevel && (
                <p className="text-sm text-foreground">{profile.educationLevel}</p>
              )}
              {profile.university && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5" />
                  <span>{profile.university}</span>
                </div>
              )}
              {profile.faculty && (
                <p className="text-sm text-muted-foreground">{profile.faculty}</p>
              )}
            </CardContent>
          </Card>
        )}

        {profile.currentInterest && (
          <Card>
            <CardContent className="flex flex-col gap-3 p-5">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Bookmark className="h-4 w-4" />
                Current Interest
              </div>
              <p className="text-sm text-foreground">{profile.currentInterest}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
