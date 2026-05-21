# Contract: Course Application UI

## Learner Modal Entry

When `course.requiresForm` is true and the learner is not enrolled:

- Primary CTA label: `Apply Now`
- Modal content: `CourseApplicationStepper`
- Direct enrollment submit is not shown

When the learner has an active application:

- Primary CTA label reflects status, such as `Application Pending` or `Reviewing Application`
- Modal content: `CourseApplicationStatus`
- Duplicate application submit is not offered

## Stepper Contract

Steps:

1. Identity
2. Status
3. Story
4. Goals & Review

Required common fields:

- full name
- age
- email
- phone
- learner status
- personal statement
- background
- learning goals

Conditional fields:

- High School: high school name
- Undergraduate: university, faculty
- Graduate: university, faculty, graduation year
- Professional: work field, years of experience

## Visual Contract

- Use frosted glass modal surface with visible light and dark mode contrast.
- Use cyan, hero-blue, orange, and emerald accents only as state or progress colors.
- Use Lucide icons, not emoji icons.
- Use stable modal dimensions to prevent step transitions from shifting the dialog.
- Animate progress and step transitions using transform and opacity.
- Respect reduced motion by replacing slide/scale transitions with opacity-only transitions.

## Accessibility Contract

- Every input has a visible label.
- Each invalid field has a field-level error message.
- The current step is announced through visible text and semantic progress indicators.
- Keyboard users can navigate forward, backward, submit, and close.
- Focus moves to the first invalid field on validation failure.
- Color is never the only validation or status indicator.

## Responsive Contract

- 375px: single-column stepper with top progress rail.
- 768px: wider modal with grouped fields and compact status cards.
- 1024px and above: optional two-column layout with progress/sidebar on the left and form content on the right.
- Long course titles must wrap without overlapping controls.
