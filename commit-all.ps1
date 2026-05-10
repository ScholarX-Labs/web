$ErrorActionPreference = "Continue"
Set-Location "C:\Users\dell\Documents\ScholarX\V2\web"

$modified = @(
  @{path="design-system/scholarx-admin/MASTER.md"; msg="chore: update admin design system master"},
  @{path="next.config.ts"; msg="chore: update next config"},
  @{path="package.json"; msg="chore: update package.json"},
  @{path="pnpm-lock.yaml"; msg="chore: update pnpm lockfile"},
  @{path="src/app/(platform)/courses/[slug]/_components/course-curriculum.tsx"; msg="fix(lint): resolve lint issues in course-curriculum"},
  @{path="src/app/(platform)/courses/[slug]/lessons/[lessonId]/_components/lesson-client-bridge.tsx"; msg="fix(lint): resolve lint issues in lesson-client-bridge"},
  @{path="src/app/(platform)/courses/[slug]/lessons/[lessonId]/_components/lesson-meta.tsx"; msg="fix(lint): resolve unused vars in lesson-meta"},
  @{path="src/app/(platform)/courses/[slug]/lessons/[lessonId]/_components/lesson-sidebar.tsx"; msg="fix(lint): resolve lint issues in lesson-sidebar"},
  @{path="src/app/(platform)/courses/[slug]/lessons/[lessonId]/_components/lesson-tabs.tsx"; msg="fix(lint): fix setState-in-effect and unused imports in lesson-tabs"},
  @{path="src/app/admin/_components/admin-shell.tsx"; msg="fix(lint): fix setState-in-effect in admin-shell"},
  @{path="src/app/admin/_components/admin-sidebar.tsx"; msg="fix(lint): resolve lint issues in admin-sidebar"},
  @{path="src/app/admin/courses/[courseId]/_components/lesson-editor.tsx"; msg="fix(lint): remove unused imports in lesson-editor"},
  @{path="src/app/admin/courses/[courseId]/page.tsx"; msg="fix(lint): remove unused parameter in course detail page"},
  @{path="src/app/admin/courses/_components/courses-table.tsx"; msg="fix(lint): resolve lint issues in courses-table"},
  @{path="src/app/admin/courses/new/page.tsx"; msg="fix(lint): fix no-explicit-any and unused variable"},
  @{path="src/app/admin/inquiries/_components/inquiries-table.tsx"; msg="fix(lint): resolve lint issues in inquiries-table"},
  @{path="src/app/admin/page.tsx"; msg="fix(lint): resolve lint issues in admin page"},
  @{path="src/app/auth/signin/page.tsx"; msg="fix(lint): resolve lint issues in signin page"},
  @{path="src/app/auth/signup/page.tsx"; msg="fix(lint): resolve lint issues in signup page"},
  @{path="src/app/layout.tsx"; msg="fix(lint): resolve lint issues in root layout"},
  @{path="src/components/admin/data-table.tsx"; msg="fix(lint): suppress incompatible-library warning in data-table"},
  @{path="src/components/animations/stagger.tsx"; msg="fix(lint): resolve lint issues in stagger animation"},
  @{path="src/components/ui/expand-map.tsx"; msg="fix(lint): resolve lint issues in expand-map"},
  @{path="src/components/ui/liquid-glass.tsx"; msg="fix(lint): fix img-element and eslint-disable in liquid-glass"},
  @{path="src/components/ui/mac-os-dock.tsx"; msg="fix(lint): add eslint-disable for img element"},
  @{path="src/components/ui/modern-background-paths.tsx"; msg="fix(lint): fix exhaustive-deps and unused var"},
  @{path="src/components/ui/morphing-popover.tsx"; msg="fix(lint): fix setState-in-effect and forward ref"},
  @{path="src/components/ui/progress-indicator.tsx"; msg="fix(lint): resolve lint issues in progress-indicator"},
  @{path="src/components/ui/sparkles.tsx"; msg="fix(lint): resolve lint issues in sparkles"},
  @{path="src/components/ui/wave-path.tsx"; msg="fix(lint): fix exhaustive-deps in wave-path"},
  @{path="src/domain/admin/contracts/admin-repository.contract.ts"; msg="fix(lint): resolve lint issues in admin repository contract"},
  @{path="src/domain/admin/contracts/admin-types.ts"; msg="fix(lint): resolve lint issues in admin types"},
  @{path="src/domain/admin/contracts/admin-validation.schemas.ts"; msg="fix(lint): resolve lint issues in admin validation schemas"},
  @{path="src/domain/admin/infrastructure/db/admin-db.schema.ts"; msg="fix(lint): resolve lint issues in admin db schema"},
  @{path="src/domain/admin/infrastructure/db/admin.repository.ts"; msg="fix(lint): resolve lint issues in admin repository"},
  @{path="src/domain/courses/application/next-course-catalog.service.ts"; msg="fix(lint): remove unused eslint-disable, fix type"},
  @{path="src/lib/auth.ts"; msg="fix(lint): resolve lint issues in auth lib"},
  @{path="src/lib/course-categories.ts"; msg="fix(lint): resolve lint issues in course categories"},
  @{path="src/proxy.ts"; msg="chore: update proxy.ts"},
  @{path=".gemini/skills/ui-ux-pro-max/scripts/__pycache__/design_system.cpython-314.pyc"; msg="chore: update pyc cache"},
  @{path="src/hooks/courses/useCourses.ts"; msg="chore: remove unused useCourses hook"},
  @{path="src/hooks/queries/use-courses.ts"; msg="chore: remove unused use-courses hook"}
)

$untracked = @(
  @{path="design-system/scholarx-admin/pages/"; msg="chore: add admin design system pages"},
  @{path="drizzle/0002_lessons_sort_unique.sql"; msg="chore: add drizzle migration"},
  @{path="drizzle/meta/0002_snapshot.json"; msg="chore: add drizzle meta snapshot"},
  @{path="scripts/seed-lessons.ts"; msg="feat: add seed lessons script"},
  @{path="src/app/not-found.tsx"; msg="feat: add custom not-found page"},
  @{path="src/components/HamburgerIcon.tsx"; msg="feat: add HamburgerIcon component"},
  @{path="src/components/PremiumHeader.tsx"; msg="feat: add PremiumHeader component"},
  @{path="src/components/PremiumHeaderClient.tsx"; msg="feat: add PremiumHeaderClient component"},
  @{path="src/components/PremiumMobileMenu.tsx"; msg="feat: add PremiumMobileMenu component"},
  @{path="src/components/ui/animated-select-demo.tsx"; msg="feat: add animated select demo"},
  @{path="src/components/ui/animated-select.tsx"; msg="feat: add animated select component"},
  @{path="src/components/ui/animated-text-demo.tsx"; msg="feat: add animated text demo"},
  @{path="src/components/ui/animated-text.tsx"; msg="feat: add animated text component"},
  @{path="src/components/ui/copy-button.tsx"; msg="feat: add copy button component"},
  @{path="src/components/ui/emoji-rating.tsx"; msg="feat: add emoji rating component"},
  @{path="src/components/ui/not-found.tsx"; msg="feat: add not-found UI component"},
  @{path="src/components/ui/sign-in-card-2.tsx"; msg="feat: add sign-in card variant"},
  @{path="src/components/ui/tabs.tsx"; msg="feat: add tabs component"},
  @{path="src/components/ui/tree-demo.tsx"; msg="feat: add tree demo"},
  @{path="src/components/ui/tree.tsx"; msg="feat: add tree component"},
  @{path="src/hooks/use-scroll-direction.ts"; msg="feat: add useScrollDirection hook"}
)

$ok = 0
$fail = 0
function Commit-One($file, $msg) {
  git add -- $file 2>&1 | Out-Null
  if ($LASTEXITCODE -eq 0) {
    git commit -m $msg 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
      $script:ok++
      Write-Host "OK: $msg"
    } else {
      $script:fail++
      Write-Host "FAIL commit: $file"
    }
  } else {
    $script:fail++
    Write-Host "FAIL add: $file"
  }
}

Write-Host "=== Modified files ==="
foreach ($item in $modified) { Commit-One $item.path $item.msg }

Write-Host "=== Untracked files ==="
foreach ($item in $untracked) { Commit-One $item.path $item.msg }

Write-Host "OK=$ok FAIL=$fail"
