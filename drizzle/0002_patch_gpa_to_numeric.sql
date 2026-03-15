-- Custom SQL migration file, put your code below! --
ALTER TABLE "user"
ALTER COLUMN "gpa" TYPE numeric(3, 2) USING ROUND("gpa"::numeric, 2);
;