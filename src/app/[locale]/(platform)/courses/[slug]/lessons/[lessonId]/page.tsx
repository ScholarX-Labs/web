/**
 * [locale] lesson page — must NOT be a simple re-export.
 *
 * Next.js binds Server Action POST endpoints to the page module that
 * renders the Client Component calling the action. A bare `export { default }`
 * re-export produces a separate module that doesn't inherit the action
 * endpoint registration from (platform)/…/page, so Server Action POSTs to
 * /ar/courses/[slug]/lessons/[lessonId] return 404 and then time out.
 *
 * Solution: import and re-export all page exports directly so this module
 * fully resolves the same component tree — including the `syncLessonProgress`
 * action binding — under the [locale] URL segment.
 */
import { default as Page, generateMetadata } from "../../../../../../(platform)/courses/[slug]/lessons/[lessonId]/page";

export { generateMetadata };
export default Page;
