CREATE UNIQUE INDEX "lessons_course_sort_uq" ON "courses"."lessons" USING btree ("course_id","sort_index");
