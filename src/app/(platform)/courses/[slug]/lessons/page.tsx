import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";

interface LessonsRootPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * LessonsRootPage — Redirects to the first lesson of the course.
 * This ensures that "Opening the lesson page" without a specific ID 
 * lands the user on the first lesson automatically.
 */
export default async function LessonsRootPage({ params }: LessonsRootPageProps) {
  const { slug } = await params;
  
  // Always redirect to the first lesson (lesson-1)
  // In a more complex app, this could check the user's last watched lesson
  redirect(ROUTES.LESSON(slug, "lesson-1"));
}
