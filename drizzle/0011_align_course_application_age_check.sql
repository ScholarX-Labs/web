ALTER TABLE "courses"."course_applications"
DROP CONSTRAINT "course_applications_age_chk";

ALTER TABLE "courses"."course_applications"
ADD CONSTRAINT "course_applications_age_chk"
CHECK ("courses"."course_applications"."age" between 13 and 80);
