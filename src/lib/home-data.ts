import { 
  Award, 
  BookOpen, 
  Users, 
  CheckCircle, 
  Code, 
  Cpu,
  GraduationCap,
  Briefcase,
  Building
} from "lucide-react";

export const HOME_DATA = {
  hero: {
    badge: "Now in Beta",
    headline: [
      "The premium learning",
      "platform for the",
      "next generation."
    ],
    subline: "Master high-demand skills with world-class curriculum designed by industry experts. Join ScholarX to unlock your potential.",
    primaryCTA: { label: "Get Started", href: "/auth/signup" },
    secondaryCTA: { label: "Explore Courses", href: "/courses" }
  },
  
  features: [
    {
      id: "f1",
      icon: Users,
      title: "Expert Instructors",
      description: "Learn directly from senior engineers and designers at top tech companies.",
      accentClass: "text-blue-500 bg-blue-500/10"
    },
    {
      id: "f2",
      icon: BookOpen,
      title: "Structured Learning",
      description: "Carefully curated paths that take you from fundamentals to advanced concepts.",
      accentClass: "text-purple-500 bg-purple-500/10"
    },
    {
      id: "f3",
      icon: Award,
      title: "Recognized Certificates",
      description: "Earn certificates that demonstrate your mastery and are valued by employers.",
      accentClass: "text-amber-500 bg-amber-500/10"
    },
    {
      id: "f4",
      icon: Code,
      title: "Project-Based",
      description: "Build real-world applications to solidify your knowledge and portfolio.",
      accentClass: "text-emerald-500 bg-emerald-500/10"
    },
    {
      id: "f5",
      icon: Cpu,
      title: "AI Search",
      description: "Instantly find answers across all course materials with our AI assistant.",
      accentClass: "text-indigo-500 bg-indigo-500/10"
    },
    {
      id: "f6",
      icon: CheckCircle,
      title: "Continuous Updates",
      description: "Curriculum is constantly refreshed to keep pace with industry trends.",
      accentClass: "text-rose-500 bg-rose-500/10"
    }
  ],

  services: {
    whyChoose: [
      {
        id: "w1",
        icon: GraduationCap,
        heading: "Academic Rigor",
        body: "University-grade computer science foundations combined with modern tooling."
      },
      {
        id: "w2",
        icon: Briefcase,
        heading: "Career Readiness",
        body: "Curriculum aligned precisely with what hiring managers are looking for today."
      },
      {
        id: "w3",
        icon: Users,
        heading: "Vibrant Community",
        body: "Connect, collaborate, and grow with thousands of ambitious peers worldwide."
      }
    ],
    whoWeHelp: [
      {
        id: "p1",
        icon: GraduationCap,
        label: "Aspiring Engineers",
        description: "Looking to break into tech with strong fundamentals and practical skills."
      },
      {
        id: "p2",
        icon: Briefcase,
        label: "Working Professionals",
        description: "Aiming to upskill, transition roles, or stay ahead of the technology curve."
      },
      {
        id: "p3",
        icon: Building,
        label: "Organizations",
        description: "Seeking to train their teams efficiently with standardized, high-quality content."
      }
    ]
  },

  impact: [
    { id: "i1", value: 12000, suffix: "+", label: "Active Learners", colorClass: "text-blue-500" },
    { id: "i2", value: 80, suffix: "+", label: "Premium Courses", colorClass: "text-purple-500" },
    { id: "i3", value: 50, suffix: "+", label: "Expert Instructors", colorClass: "text-emerald-500" },
    { id: "i4", value: 15, suffix: "+", label: "Countries Reached", colorClass: "text-amber-500" }
  ],

  cta: {
    headline: "Ready to elevate your skills?",
    subline: "Join thousands of learners and start your journey today. Access world-class courses and build the career of your dreams.",
    buttonLabel: "Get Started Now",
    buttonHref: "/auth/signup"
  }
};
