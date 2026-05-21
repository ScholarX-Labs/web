const fs = require('fs');

let content = fs.readFileSync('src/app/admin/courses/page.tsx', 'utf8');
content = `export const dynamic = "force-dynamic";\n` + content;
fs.writeFileSync('src/app/admin/courses/page.tsx', content);

let content2 = fs.readFileSync('src/app/admin/users/page.tsx', 'utf8');
content2 = `export const dynamic = "force-dynamic";\n` + content2;
fs.writeFileSync('src/app/admin/users/page.tsx', content2);
