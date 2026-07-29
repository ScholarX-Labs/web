import { SearchResult } from "@/lib/ai-search/types";
import { Badge } from "@/components/ai-search/ui/badge";
import Link from "next/link";
import { serializeJsonLd } from "@/lib/seo/json-ld";

interface OpportunityDetailProps {
  opportunity: SearchResult;
  lang?: "en" | "ar";
  dir?: "ltr" | "rtl";
}

export function OpportunityDetail({
  opportunity,
  lang = "en",
  dir = "ltr",
}: OpportunityDetailProps) {
  const {
    title,
    description,
    category,
    tags,
    fundingLevel,
    deadline,
    location,
    eligibility,
    benefits,
  } = opportunity;

  return (
    <article className="mx-auto max-w-3xl px-6 py-12" lang={lang} dir={dir}>
      {category && <Badge>{category}</Badge>}

      <h1 className="text-4xl font-extrabold mt-4 mb-6">{title}</h1>

      <p className="text-lg text-muted-foreground leading-relaxed mb-8">
        {description}
      </p>

      <dl className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        {fundingLevel && (
          <div>
            <dt className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Funding
            </dt>
            <dd className="text-lg font-bold">{fundingLevel}</dd>
          </div>
        )}
        {deadline && (
          <div>
            <dt className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Deadline
            </dt>
            <dd className="text-lg font-bold">{deadline}</dd>
          </div>
        )}
        {location && (
          <div>
            <dt className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Location
            </dt>
            <dd className="text-lg font-bold">{location}</dd>
          </div>
        )}
        {eligibility && (
          <div className="md:col-span-2">
            <dt className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Eligibility
            </dt>
            <dd className="text-base">{eligibility}</dd>
          </div>
        )}
      </dl>

      {benefits && benefits.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4">Benefits</h2>
          <ul className="space-y-2">
            {benefits.map((benefit, index) => (
              <li
                key={`${benefit}-${index}`}
                className="flex items-start gap-3"
              >
                <span className="text-muted-foreground mt-1">-</span>
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-10">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      <div className="border-t pt-8 mt-8 text-center">
        <p className="text-muted-foreground mb-4">
          Want to explore more opportunities like this?
        </p>
        <Link
          href="/auth/signin"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-scholar-blue to-scholar-blue-dark shadow-lg shadow-scholar-blue/30 hover:shadow-xl transition-all"
        >
          Sign in to search all opportunities
        </Link>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd({
            "@context": "https://schema.org",
            "@type": "EducationalOccupationalProgram",
            name: title,
            description,
            ...(deadline && { timeToComplete: deadline }),
            ...(location && {
              location: { "@type": "Place", name: location },
            }),
          }),
        }}
      />
    </article>
  );
}
