import {
  Globe,
  Users,
  Target,
  BookOpen,
  Briefcase,
  Calendar,
  CircleDashed,
  ArrowRight,
  Check
} from "lucide-react";

// Hero Section
export const HERO_CONTENT = {
  title: "Empowering Youth",
  subtitle: "Changing",
  highlight: "Lives.",
  description:
    "ScholarX helps students and young professionals unlock global opportunities",
  stats: {
    count: "10,000",
    text: "students worldwide",
  },
};

export const HERO_BUTTONS = [
  {
    id: "explore",
    text: "Explore Services",
    type: "primary",
    link: "/services",
    icon: ArrowRight,
  },
  {
    id: "join",
    text: "Join our Community",
    type: "secondary",
    link: "/services",
    icon: ArrowRight,
  },
];

// Features Section
export const FEATURES_CONTENT = {
  title: "Welcome to",
  highlight: "ScholarX",
  description:
    "ScholarX is dedicated to empowering students through education, mentorship, and community support. We believe in breaking down barriers and creating opportunities for ambitious learners worldwide",
  cta: {
    text: "Take the First Step Today!",
    link: "/auth/signup",
    icon: ArrowRight,
  },
  image: "/home-page/home-feature.jpg",
  imageAlt: "ScholarX Education",
};

export const FEATURES_LIST = [
  {
    id: "training",
    text: "Development Training Program",
    icon: Check,
  },
  {
    id: "community",
    text: "Community Support",
    icon: Check,
  },
  {
    id: "resources",
    text: "Resource Library",
    icon: Check,
  },
];

// Why Choose ScholarX Section
export const WHY_CHOOSE_SECTION = {
  title: "Why Choose",
  highlight: "ScholarX?",
  description:
    "We're dedicated to making education accessible and providing the resources students need to succeed globally.",
  theme: "light", // light background
};

export const WHY_CHOOSE_SERVICES = [
  {
    id: "scholarship",
    icon: Globe,
    title: "Scholarship Research",
    description: "Access curated local and international scholarships",
    color: "orange",
  },
  {
    id: "mentorship",
    icon: Users,
    title: "Mentorship",
    description: "Connect with experienced mentors in your field",
    color: "orange",
  },
  {
    id: "opportunities",
    icon: Target,
    title: "Opportunities",
    description: "Discover global learning and career opportunities",
    color: "orange",
  },
];

// Who We Help Section
export const WHO_WE_HELP_SECTION = {
  title: "Who We",
  highlight: "Help?",
  description:
    "We support students at every stage of their educational journey, providing tailored resources for their specific needs.",
  theme: "white", // white background
};

export const WHO_WE_HELP_SERVICES = [
  {
    id: "highschool",
    icon: BookOpen,
    title: "High School Students",
    description:
      "Discover scholarships and prepare for university applications early.",
    color: "black",
  },
  {
    id: "university",
    icon: Users,
    title: "University Students",
    description:
      "Access mentorship, internships, and study-abroad opportunities.",
    color: "black",
  },
  {
    id: "graduates",
    icon: Briefcase,
    title: "Recent Graduates",
    description:
      "Find career guidance, advanced degrees, and professional development.",
    color: "black",
  },
];

// Impact Stats
export const IMPACT_SECTION = {
  title: "Our",
  highlight: "Impact",
  description:
    "We're dedicated to making education accessible and providing the resources students need to succeed globally.",
};

export const IMPACT_STATS = [
  {
    id: "students",
    icon: Users,
    value: 15000,
    label: "Students attended our programs",
    suffix: "",
    animationDuration: 2000,
  },
  {
    id: "partners",
    icon: CircleDashed,
    value: 96,
    label: "Partners",
    suffix: "",
    animationDuration: 1800,
  },
  {
    id: "events",
    icon: Calendar,
    value: 38,
    label: "Events and Programs",
    suffix: "",
    animationDuration: 1500,
  },
];
