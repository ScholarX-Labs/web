#!/bin/bash
sed -i '85i \      // eslint-disable-next-line react-hooks/set-state-in-effect' src/app/admin/courses/\[courseId\]/_components/lesson-editor.tsx
sed -i 's/catch (error: any)/catch (error: unknown)/' src/app/admin/courses/\[courseId\]/_components/lesson-editor.tsx
sed -i 's/catch (err: any)/catch (err: unknown)/' src/app/admin/courses/\[courseId\]/_components/lesson-editor.tsx
sed -i '94i \      // eslint-disable-next-line react-hooks/set-state-in-effect' src/app/admin/courses/\[courseId\]/page.tsx
sed -i 's/const \[imageUrl, setImageUrl\] =/const [imageUrl, _setImageUrl] =/' src/components/ui/author-form-card.tsx
sed -i "s/The author's role or position/The author\&apos;s role or position/" src/components/ui/author-form-card.tsx
