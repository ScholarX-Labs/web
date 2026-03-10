import {
  CoursesHero,
  CoursesFilterSection,
  LatestCoursesSection,
} from "@/components/courses";
import { Course } from "@/types/course.types";

const SAMPLE_COURSES: Course[] = [
  {
    id: "1",
    title: "Advanced React Patterns & Internal Architecture",
    slug: "advanced-react-patterns",
    description:
      "Master React under the hood. Build enterprise-grade applications focusing on performance, reusability, and clean architecture.",
    thumbnail:
      "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=800&auto=format&fit=crop",
    price: 199,
    currentPrice: 199,
    originalPrice: 250,
    category: "Engineering",
    level: "Advanced",
    duration: "14h 30m",
    videosCount: 42,
    lessonsCount: 14,
    studentsCount: 99,
    rating: 4.9,
    totalRatings: 1240,
    instructor: {
      id: "i1",
      name: "Dan Abramov",
      title: "Former React Core Team",
      avatar:
        "https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=150&auto=format&fit=crop",
    },
    requiresForm: false,
    isPublished: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    title: "UI/UX Design for Software Engineers",
    slug: "ui-ux-design-for-engineers",
    description:
      "Learn how to design beautiful, intuitive interfaces. Bridge the gap between engineering and design with practical, actionable heuristics.",
    thumbnail:
      "https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=800&auto=format&fit=crop",
    price: 0,
    category: "Design",
    level: "Beginner",
    duration: "6h 15m",
    videosCount: 18,
    lessonsCount: 18,
    studentsCount: 210,
    rating: 4.7,
    totalRatings: 856,
    instructor: {
      id: "i2",
      name: "Sarah Drasner",
      title: "VP of Engineering",
      avatar:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop",
    },
    requiresForm: false,
    isPublished: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "3",
    title: "Enterprise Architecture with NestJS",
    slug: "enterprise-nestjs",
    description:
      "Scale your backend services with NestJS. Deep dive into microservices, event-driven architecture, and solid design patterns.",
    thumbnail:
      "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=800&auto=format&fit=crop",
    price: 149,
    currentPrice: 149,
    originalPrice: 200,
    category: "Backend",
    level: "Intermediate",
    duration: "22h 45m",
    videosCount: 65,
    lessonsCount: 22,
    studentsCount: 87,
    rating: 4.8,
    totalRatings: 342,
    instructor: {
      id: "i3",
      name: "Kamil Myśliwiec",
      title: "Creator of NestJS",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop",
    },
    requiresForm: true,
    isPublished: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "4",
    title: "The Rust Programming Language",
    slug: "rust-programming",
    description:
      "Systems programming without fear. Memory safety, fearless concurrency, and zero-cost abstractions explained in depth.",
    thumbnail:
      "https://images.unsplash.com/photo-1504639725590-34d0984388bd?q=80&w=800&auto=format&fit=crop",
    price: 49,
    currentPrice: 49,
    originalPrice: 99,
    category: "Systems",
    level: "Beginner",
    duration: "18h 00m",
    videosCount: 54,
    lessonsCount: 14,
    studentsCount: 312,
    rating: 5.0,
    totalRatings: 2100,
    instructor: {
      id: "i4",
      name: "Ashley Williams",
      title: "Rust Core Team",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=150&auto=format&fit=crop",
    },
    requiresForm: false,
    isPublished: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export default function CoursesPage() {
  return (
    <div className="w-full flex flex-col pb-10">
      <CoursesHero />
      <LatestCoursesSection courses={SAMPLE_COURSES} />
      <CoursesFilterSection courses={SAMPLE_COURSES} />
    </div>
  );
}
