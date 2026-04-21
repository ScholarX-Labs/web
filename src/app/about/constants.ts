export type AboutImage = {
  src: string;
  alt: string;
  caption?: string;
};

export type HeroGalleryItem = {
  id: number;
  src: string;
  alt: string;
};

export type ImpactItem = {
  id: string;
  icon: string;
  alt: string;
  title: string;
  description: string;
};

export const HERO_SECTION = {
  label: "About Us",
  title: "The Story Behind ScholarX",
  gallery: [
    { id: 1, src: "/about/img-1.png", alt: "ScholarX event 1" },
    { id: 2, src: "/about/img-2.png", alt: "ScholarX event 2" },
    { id: 3, src: "/about/img-3.png", alt: "ScholarX event 3" },
  ],
} as const;

export const MISSION_SECTION = {
  label: "Our Mission",
  title: "Empowering Youth, Creating Opportunities",
  content: [
    "ScholarX was founded with a clear vision to bridge the gap between ambition and opportunity. Our mission is to empower students and young professionals with the resources, mentorship, and guidance needed to secure scholarships and educational opportunities worldwide. We believe that every student deserves a fair chance at accessing quality education, and we work tirelessly to make that a reality. Our approach is holistic, ensuring that students receive not only scholarship guidance but also essential skills that will serve them throughout their careers.",
    "Through a combination of training programs, awareness events, and structured skills development initiatives, ScholarX ensures that young people are not left behind in the race for global opportunities. By collaborating with top institutions and forming strategic alliances, we create a sustainable network that continuously supports students in their educational journeys.",
  ],
  image: {
    src: "/about/img-students.png",
    alt: "Students collaborating",
  },
} as const;

export const FOUNDER_INTRO = {
  label: "The Founder's Journey",
  title: "From Rejection to Revolution",
  content: [
    "ScholarX was born out of a personal challenge faced by our founder, Asaf Nady. Growing up in rural Upper Egypt, Asaf had big dreams but limited resources. At the age of 16, he applied for Egypt's prestigious STEM high school program but was rejected.",
    "That moment could have been the end of his dreams, but instead, it became the spark that ignited his lifelong mission. Instead of giving up, Asaf turned his setback into motivation, realizing that thousands of students face similar challenges due to lack of awareness, guidance, and support. He committed himself to learning about educational opportunities worldwide, developing strategies to secure scholarships, and helping others along the way.",
  ],
  image: {
    src: "/about/founder-1.png",
    alt: "Founder's journey",
    caption: "Meet Asaf Nady - The Visionary Behind ScholarX",
  },
};

export const FOUNDER_JOURNEY = {
  content: [
    "Determined to change the narrative, Asaf embarked on an extensive journey of self-education and networking. He began reaching out to mentors, joining scholarship programs, and attending leadership training sessions. He participated in numerous global programs, including the SUSI Economic Empowerment Program in USA and the Ashoka Changemakers Initiative, where he gained firsthand experience in leadership, economic development, and educational equity.",
    "During this transformative period, Asaf began mentoring other students in his community, sharing insights on how to apply for scholarships, craft compelling applications, and develop essential skills. Seeing the impact of his guidance, he realized that many talented students simply lacked the right support system. This realization drove him to create ScholarX in 2022, a platform that would offer structured training sessions, skill building workshops, and a network of global opportunities.",
  ],
  image: {
    src: "/about/founder-2.png",
    alt: "Harvard campus",
  },
};

export const FOUNDER_VISION = {
  content: [
    "What started as a small initiative helping a handful of students has now grown into a nationwide movement, impacting thousands across Egypt. ScholarX has evolved into a comprehensive educational ecosystem, offering specialized training programs, international networking events, mentorship circles, and guidance in securing scholarships and internships.",
    "Asaf's vision extends beyond Egypt. He aims to expand ScholarX globally, ensuring that students from underprivileged backgrounds worldwide receive the support they need to pursue their educational and professional dreams. His ultimate goal is to build a sustainable educational platform that connects students with mentors, funding opportunities, and skill enhancing experiences, enabling them to thrive in a competitive global landscape.",
  ],
  image: {
    src: "/about/founder-3.png",
    alt: "Founder's vision",
  },
};

export const IMPACT_SECTION = {
  title: "Our Impact",
  items: [
    {
      id: "training",
      icon: "/about/icon-0.png",
      alt: "Training students",
      title: "Trained thousands of students",
      description:
        "On scholarship applications, leadership skills, and personal development",
    },
    {
      id: "partnerships",
      icon: "/about/icon-1.png",
      alt: "Partnerships",
      title: "Secured partnerships",
      description:
        "With global institutions like the U.S. Department of State, U.S. Embassy in Cairo, Ashoka, Schneider Electric, and Aspire Institute (Harvard-founded)",
    },
    {
      id: "students",
      icon: "/about/icon-2.png",
      alt: "Helping students",
      title: "Helped students",
      description:
        "Access international scholarships, exchange programs, and career-changing opportunities",
    },
    {
      id: "network",
      icon: "/about/icon-3.png",
      alt: "Built a strong network",
      title: "Built a strong network",
      description:
        "Of alumni and mentors, who continue to support the next generation of students",
    },
    {
      id: "campaigns",
      icon: "/about/icon-4.png",
      alt: "Conducted awareness campaigns",
      title: "Conducted awareness campaigns",
      description:
        "Across schools and universities, reaching students who otherwise would not have known about available opportunities",
    },
  ],
};

export const VISION_SECTION = {
  image: {
    src: "/about/group-vision.png",
    alt: "Diverse students collaborating on global opportunities",
  },
  text: "To make global opportunities accessible to every student, regardless of background or circumstances. We envision a world where educational equity is a reality, where students from all socioeconomic backgrounds can aspire to and achieve academic excellence.",
};

export const ANIMATION_TIMINGS = {
  stagger: 100,
} as const;
