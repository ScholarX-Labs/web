"use client";

import { useState, useEffect, useCallback, startTransition } from "react";

import { motion } from "framer-motion";
import {
  User,
  GraduationCap,
  Link2,
  Shield,
  Save,
  Loader2,
  Globe,
  Eye,
  EyeOff,
  BookOpen,
  Heart,
  Settings,
} from "lucide-react";
import { toast } from "sonner";


import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { SocialIconLink } from "@/components/profile/social-icon-link";
import { AvatarUpload } from "@/components/profile/avatar-upload";
import { MyEnrolledCourses } from "@/components/profile/my-enrolled-courses";
import { SavedOpportunitiesList } from "@/components/profile/saved-opportunities-list";
import { AccountSettingsForm } from "@/components/profile/account-settings-form";
import { TabErrorBoundary } from "@/components/profile/tab-error-boundary";
import { getProfile, updateProfile, updateSocialLinks, toggleProfilePrivacy } from "@/actions/profile.actions";

type TabId = "personal" | "education" | "social" | "privacy" | "courses" | "saved" | "settings";

interface TabConfig {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const TABS: TabConfig[] = [
  { id: "personal", label: "Personal Info", icon: <User className="h-4 w-4" /> },
  { id: "education", label: "Education", icon: <GraduationCap className="h-4 w-4" /> },
  { id: "social", label: "Social Links", icon: <Link2 className="h-4 w-4" /> },
  { id: "privacy", label: "Privacy", icon: <Shield className="h-4 w-4" /> },
  { id: "courses", label: "My Courses", icon: <BookOpen className="h-4 w-4" /> },
  { id: "saved", label: "Saved", icon: <Heart className="h-4 w-4" /> },
  { id: "settings", label: "Settings", icon: <Settings className="h-4 w-4" /> },
];

interface ProfileData {
  id: string;
  firstName: string;
  lastName: string;
  firstNameAr: string | null;
  lastNameAr: string | null;
  email: string;
  image: string | null;
  username: string | null;
  educationLevel: string | null;
  university: string | null;
  faculty: string | null;
  currentInterest: string | null;
  nationality: string | null;
  city: string | null;
  dateOfBirth: string | null;
  industry: string | null;
  gpa: number | null;
  githubUrl: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  twitterUrl: string | null;
  linkedinUrl: string | null;
  isProfilePublic: boolean;
}

export default function ProfilePage() {

  const [activeTab, setActiveTab] = useState<TabId>("personal");
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      startTransition(() => { setLoading(true); });
      const result = await getProfile();
      if (cancelled) return;
      if (result.success && result.data) {
        const data = result.data as Record<string, unknown>;
        setProfile({
          id: data.id as string,
          firstName: data.firstName as string,
          lastName: data.lastName as string,
          firstNameAr: (data.firstNameAr as string) ?? null,
          lastNameAr: (data.lastNameAr as string) ?? null,
          email: data.email as string,
          image: (data.image as string) ?? null,
          username: (data.username as string) ?? null,
          educationLevel: (data.educationLevel as string) ?? null,
          university: (data.university as string) ?? null,
          faculty: (data.faculty as string) ?? null,
          currentInterest: (data.currentInterest as string) ?? null,
          nationality: (data.nationality as string) ?? null,
          city: (data.city as string) ?? null,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth as string).toISOString().split("T")[0] : null,
          industry: (data.industry as string) ?? null,
          gpa: (data.gpa as number) ?? null,
          githubUrl: (data.githubUrl as string) ?? null,
          facebookUrl: (data.facebookUrl as string) ?? null,
          instagramUrl: (data.instagramUrl as string) ?? null,
          twitterUrl: (data.twitterUrl as string) ?? null,
          linkedinUrl: (data.linkedinUrl as string) ?? null,
          isProfilePublic: data.isProfilePublic as boolean,
        });
      } else {
        toast.error("Failed to load profile");
      }
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const handleSavePersonal = useCallback(async () => {
    if (!profile) return;
    setSaving(true);
    const result = await updateProfile({
      firstName: profile.firstName,
      lastName: profile.lastName,
      firstNameAr: profile.firstNameAr || undefined,
      lastNameAr: profile.lastNameAr || undefined,
      nationality: profile.nationality || undefined,
      city: profile.city || undefined,
      dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth) : undefined,
    });
    if (result.success) {
      toast.success("Profile updated");
    } else {
      toast.error(typeof result.error === "string" ? result.error : "Failed to update");
    }
    setSaving(false);
  }, [profile]);

  const handleSaveEducation = useCallback(async () => {
    if (!profile) return;
    setSaving(true);
    const result = await updateProfile({
      educationLevel: profile.educationLevel || undefined,
      university: profile.university || undefined,
      faculty: profile.faculty || undefined,
      currentInterest: profile.currentInterest || undefined,
      industry: profile.industry || undefined,
      gpa: profile.gpa ?? undefined,
    });
    if (result.success) {
      toast.success("Education info updated");
    } else {
      toast.error(typeof result.error === "string" ? result.error : "Failed to update");
    }
    setSaving(false);
  }, [profile]);

  const handleSaveSocial = useCallback(async () => {
    if (!profile) return;
    setSaving(true);
    const result = await updateSocialLinks({
      githubUrl: profile.githubUrl || "",
      facebookUrl: profile.facebookUrl || "",
      instagramUrl: profile.instagramUrl || "",
      twitterUrl: profile.twitterUrl || "",
      linkedinUrl: profile.linkedinUrl || "",
    });
    if (result.success) {
      toast.success("Social links updated");
    } else {
      toast.error(typeof result.error === "string" ? result.error : "Failed to update");
    }
    setSaving(false);
  }, [profile]);

  const handleAvatarUpdate = useCallback((url: string) => {
    setProfile((prev) => prev ? { ...prev, image: url } : null);
  }, []);

  const handleTogglePrivacy = useCallback(async () => {
    if (!profile) return;
    const result = await toggleProfilePrivacy();
    if (result.success && result.data) {
      const data = result.data as { isProfilePublic: boolean };
      setProfile((prev) => prev ? { ...prev, isProfilePublic: data.isProfilePublic } : null);
      toast.success(data.isProfilePublic ? "Profile is now public" : "Profile is now private");
    } else {
      toast.error("Failed to toggle privacy");
    }
  }, [profile]);

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (!profile) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Could not load profile.</p>
      </div>
    );
  }

  const initials = `${profile.firstName?.charAt(0) ?? ""}${profile.lastName?.charAt(0) ?? ""}`.toUpperCase();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-8 md:px-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <AvatarUpload
          currentImage={profile.image}
          name={`${profile.firstName} ${profile.lastName}`}
          initials={initials}
          onUploadComplete={handleAvatarUpdate}
          size={64}
        />
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {profile.firstName} {profile.lastName}
          </h1>
          <p className="text-sm text-muted-foreground">@{profile.username ?? "username"}</p>
        </div>
      </div>

      <Separator />

      {/* Mobile Tab Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2 md:hidden">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Desktop Layout */}
      <div className="flex flex-1 gap-8">
        {/* Desktop Sidebar */}
        <aside className="hidden w-56 shrink-0 md:block">
          <nav className="flex flex-col gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content Area */}
        <div className="flex-1">
          <AnimatedTabContent active={activeTab === "personal"}>
            <TabErrorBoundary tabName="Personal Info">
              <PersonalInfoTab profile={profile} setProfile={setProfile} onSave={handleSavePersonal} saving={saving} />
            </TabErrorBoundary>
          </AnimatedTabContent>
          <AnimatedTabContent active={activeTab === "education"}>
            <TabErrorBoundary tabName="Education">
              <EducationTab profile={profile} setProfile={setProfile} onSave={handleSaveEducation} saving={saving} />
            </TabErrorBoundary>
          </AnimatedTabContent>
          <AnimatedTabContent active={activeTab === "social"}>
            <TabErrorBoundary tabName="Social Links">
              <SocialLinksTab profile={profile} setProfile={setProfile} onSave={handleSaveSocial} saving={saving} />
            </TabErrorBoundary>
          </AnimatedTabContent>
          <AnimatedTabContent active={activeTab === "privacy"}>
            <TabErrorBoundary tabName="Privacy">
              <PrivacyTab profile={profile} onToggle={handleTogglePrivacy} />
            </TabErrorBoundary>
          </AnimatedTabContent>
          <AnimatedTabContent active={activeTab === "courses"}>
            <TabErrorBoundary tabName="My Courses">
              <MyEnrolledCourses />
            </TabErrorBoundary>
          </AnimatedTabContent>
          <AnimatedTabContent active={activeTab === "saved"}>
            <TabErrorBoundary tabName="Saved">
              <SavedOpportunitiesList />
            </TabErrorBoundary>
          </AnimatedTabContent>
          <AnimatedTabContent active={activeTab === "settings"}>
            <TabErrorBoundary tabName="Settings">
              <AccountSettingsForm />
            </TabErrorBoundary>
          </AnimatedTabContent>
        </div>
      </div>
    </div>
  );
}

function AnimatedTabContent({
  active,
  children,
}: {
  active: boolean;
  children: React.ReactNode;
}) {
  if (!active) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
}

function PersonalInfoTab({
  profile,
  setProfile,
  onSave,
  saving,
}: {
  profile: ProfileData;
  setProfile: (p: ProfileData) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const update = (field: keyof ProfileData, value: string | null) => {
    setProfile({ ...profile, [field]: value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
        <CardDescription>Update your personal details and contact information.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="First Name" id="firstName">
            <Input
              id="firstName"
              value={profile.firstName}
              onChange={(e) => update("firstName", e.target.value)}
            />
          </Field>
          <Field label="Last Name" id="lastName">
            <Input
              id="lastName"
              value={profile.lastName}
              onChange={(e) => update("lastName", e.target.value)}
            />
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="First Name (Arabic)" id="firstNameAr">
            <Input
              id="firstNameAr"
              value={profile.firstNameAr ?? ""}
              onChange={(e) => update("firstNameAr", e.target.value || null)}
              dir="rtl"
            />
          </Field>
          <Field label="Last Name (Arabic)" id="lastNameAr">
            <Input
              id="lastNameAr"
              value={profile.lastNameAr ?? ""}
              onChange={(e) => update("lastNameAr", e.target.value || null)}
              dir="rtl"
            />
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nationality" id="nationality">
            <Input
              id="nationality"
              value={profile.nationality ?? ""}
              onChange={(e) => update("nationality", e.target.value || null)}
            />
          </Field>
          <Field label="City" id="city">
            <Input
              id="city"
              value={profile.city ?? ""}
              onChange={(e) => update("city", e.target.value || null)}
            />
          </Field>
        </div>
        <Field label="Date of Birth" id="dateOfBirth">
          <Input
            id="dateOfBirth"
            type="date"
            value={profile.dateOfBirth ?? ""}
            onChange={(e) => update("dateOfBirth", e.target.value || null)}
          />
        </Field>
        <div className="flex justify-end">
          <Button onClick={onSave} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function EducationTab({
  profile,
  setProfile,
  onSave,
  saving,
}: {
  profile: ProfileData;
  setProfile: (p: ProfileData) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const update = (field: keyof ProfileData, value: string | null | number) => {
    setProfile({ ...profile, [field]: value as never });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Education & Career</CardTitle>
        <CardDescription>Share your academic background and professional interests.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Education Level" id="educationLevel">
            <Input
              id="educationLevel"
              placeholder="e.g. Bachelor's, Master's, PhD"
              value={profile.educationLevel ?? ""}
              onChange={(e) => update("educationLevel", e.target.value || null)}
            />
          </Field>
          <Field label="Industry" id="industry">
            <Input
              id="industry"
              placeholder="e.g. Technology, Healthcare"
              value={profile.industry ?? ""}
              onChange={(e) => update("industry", e.target.value || null)}
            />
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="University" id="university">
            <Input
              id="university"
              value={profile.university ?? ""}
              onChange={(e) => update("university", e.target.value || null)}
            />
          </Field>
          <Field label="Faculty" id="faculty">
            <Input
              id="faculty"
              value={profile.faculty ?? ""}
              onChange={(e) => update("faculty", e.target.value || null)}
            />
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Current Interest" id="currentInterest">
            <Input
              id="currentInterest"
              placeholder="e.g. Machine Learning, Full-Stack Development"
              value={profile.currentInterest ?? ""}
              onChange={(e) => update("currentInterest", e.target.value || null)}
            />
          </Field>
          <Field label="GPA" id="gpa">
            <Input
              id="gpa"
              type="number"
              min={0}
              max={4}
              step={0.1}
              placeholder="0.0 - 4.0"
              value={profile.gpa ?? ""}
              onChange={(e) => update("gpa", e.target.value ? parseFloat(e.target.value) : null)}
            />
          </Field>
        </div>
        <div className="flex justify-end">
          <Button onClick={onSave} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SocialLinksTab({
  profile,
  setProfile,
  onSave,
  saving,
}: {
  profile: ProfileData;
  setProfile: (p: ProfileData) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const update = (field: keyof ProfileData, value: string | null) => {
    setProfile({ ...profile, [field]: value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Social Links</CardTitle>
        <CardDescription>Connect your social media profiles to your ScholarX account.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <SocialField
            label="GitHub"
            id="githubUrl"
            platform="github"
            value={profile.githubUrl ?? ""}
            onChange={(v) => update("githubUrl", v || null)}
          />
          <SocialField
            label="LinkedIn"
            id="linkedinUrl"
            platform="linkedin"
            value={profile.linkedinUrl ?? ""}
            onChange={(v) => update("linkedinUrl", v || null)}
          />
          <SocialField
            label="Facebook"
            id="facebookUrl"
            platform="facebook"
            value={profile.facebookUrl ?? ""}
            onChange={(v) => update("facebookUrl", v || null)}
          />
          <SocialField
            label="X (Twitter)"
            id="twitterUrl"
            platform="twitter"
            value={profile.twitterUrl ?? ""}
            onChange={(v) => update("twitterUrl", v || null)}
          />
          <SocialField
            label="Instagram"
            id="instagramUrl"
            platform="instagram"
            value={profile.instagramUrl ?? ""}
            onChange={(v) => update("instagramUrl", v || null)}
          />
        </div>
        <div className="flex justify-end">
          <Button onClick={onSave} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PrivacyTab({
  profile,
  onToggle,
}: {
  profile: ProfileData;
  onToggle: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Privacy Settings</CardTitle>
        <CardDescription>Control the visibility of your public profile.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="flex items-start gap-3">
            {profile.isProfilePublic ? (
              <Globe className="mt-0.5 h-5 w-5 text-primary" />
            ) : (
              <EyeOff className="mt-0.5 h-5 w-5 text-muted-foreground" />
            )}
            <div>
              <p className="font-medium text-foreground">
                {profile.isProfilePublic ? "Public Profile" : "Private Profile"}
              </p>
              <p className="text-sm text-muted-foreground">
                {profile.isProfilePublic
                  ? "Your profile is visible to everyone. Anyone can view your public profile."
                  : "Your profile is hidden. Only you can see your full profile."}
              </p>
              {profile.isProfilePublic && profile.username && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Public URL: /scholar/{profile.username}
                </p>
              )}
            </div>
          </div>
          <Switch checked={profile.isProfilePublic} onCheckedChange={onToggle} />
        </div>

        {profile.isProfilePublic && (
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Eye className="h-4 w-4" />
              <span>Visible information: Name, Avatar, Education, Social Links</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

function SocialField({
  label,
  id,
  platform,
  value,
  onChange,
}: {
  label: string;
  id: string;
  platform: "github" | "linkedin" | "facebook" | "twitter" | "instagram";
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <SocialIconLink platform={platform} url={value || "https://placeholder.com"} size={24} />
      <div className="flex-1">
        <Label htmlFor={id} className="sr-only">
          {label}
        </Label>
        <Input
          id={id}
          placeholder={`${label} URL`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-8 md:px-8">
      <div className="flex items-center gap-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div>
          <Skeleton className="h-7 w-48" />
          <Skeleton className="mt-1 h-4 w-24" />
        </div>
      </div>
      <Separator />
      <div className="flex gap-8">
        <div className="hidden w-56 shrink-0 space-y-1 md:block">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
        <div className="flex-1 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
          <Skeleton className="h-20" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    </div>
  );
}
