CREATE TABLE "courses"."course_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(80) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"description" text,
	"icon_key" varchar(50) DEFAULT 'tag' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
INSERT INTO "courses"."course_categories" (
	"name",
	"slug",
	"icon_key",
	"sort_order",
	"is_active",
	"created_at",
	"updated_at"
)
SELECT
	category AS "name",
	CASE
		WHEN slug_rank = 1 THEN base_slug
		ELSE base_slug || '-' || slug_rank::text
	END AS "slug",
	CASE category
		WHEN 'Engineering' THEN 'monitor'
		WHEN 'Design' THEN 'pen-tool'
		WHEN 'Backend' THEN 'database'
		WHEN 'Systems' THEN 'cpu'
		WHEN 'Development' THEN 'code'
		WHEN 'Featured' THEN 'graduation-cap'
		WHEN 'ScholarX' THEN 'book-open'
		ELSE 'tag'
	END AS "icon_key",
	sort_order,
	true,
	now(),
	now()
FROM (
	SELECT
		category,
		base_slug,
		row_number() OVER (PARTITION BY base_slug ORDER BY category)::integer AS slug_rank,
		row_number() OVER (ORDER BY category)::integer * 10 AS sort_order
	FROM (
		SELECT DISTINCT
			trim("category") AS category,
			COALESCE(
				NULLIF(
					regexp_replace(
						regexp_replace(lower(trim("category")), '[^a-z0-9]+', '-', 'g'),
						'(^-|-$)',
						'',
						'g'
					),
					''
				),
				'category'
			) AS base_slug
		FROM "courses"."courses"
		WHERE trim("category") <> ''
	) normalized_categories
) existing_categories;
--> statement-breakpoint
CREATE UNIQUE INDEX "course_categories_name_uq" ON "courses"."course_categories" USING btree ("name");
--> statement-breakpoint
CREATE UNIQUE INDEX "course_categories_slug_uq" ON "courses"."course_categories" USING btree ("slug");
--> statement-breakpoint
CREATE INDEX "course_categories_active_sort_idx" ON "courses"."course_categories" USING btree ("is_active","sort_order");
