import type enAbout from "@/messages/en/about.json";
import type enAiSearch from "@/messages/en/aiSearch.json";
import type enAuth from "@/messages/en/auth.json";
import type enCertificates from "@/messages/en/certificates.json";
import type enCommon from "@/messages/en/common.json";
import type enContact from "@/messages/en/contact.json";
import type enCourses from "@/messages/en/courses.json";
import type enEmail from "@/messages/en/email.json";
import type enHome from "@/messages/en/home.json";
import type enMetadata from "@/messages/en/metadata.json";
import type enOpportunities from "@/messages/en/opportunities.json";
import type enProfile from "@/messages/en/profile.json";

declare global {
  interface IntlMessages {
    about: typeof enAbout;
    aiSearch: typeof enAiSearch;
    auth: typeof enAuth;
    certificates: typeof enCertificates;
    common: typeof enCommon;
    contact: typeof enContact;
    courses: typeof enCourses;
    email: typeof enEmail;
    home: typeof enHome;
    metadata: typeof enMetadata;
    opportunities: typeof enOpportunities;
    profile: typeof enProfile;
  }
}

export {};
