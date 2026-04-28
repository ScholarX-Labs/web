import pg from 'pg';
import crypto from 'crypto';

const { Client } = pg;

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false
  });
  
  try {
    await client.connect();
    console.log('Connected to database');
    
    // Create first free course
    const course1Id = crypto.randomUUID();
    await client.query(`
      INSERT INTO courses.courses (
        id, slug, title, description, image_url, video_preview_url, category, 
        current_price, status, duration, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW()
      )
    `, [
      course1Id, 
      'nextjs-for-beginners', 
      'Next.js 14 Complete Guide (Free)', 
      'Learn the foundations of Next.js 14 including App Router, Server Actions, and React Server Components.', 
      'https://placehold.co/1280x720/png?text=Next.js+Guide', 
      'https://www.youtube.com/watch?v=wm5gMKuwSYk', // Next.js tutorial
      'development', 
      0, 
      'active', 
      '3 hours'
    ]);
    console.log('Inserted Next.js free course');

    // Create second free course
    const course2Id = crypto.randomUUID();
    await client.query(`
      INSERT INTO courses.courses (
        id, slug, title, description, image_url, video_preview_url, category, 
        current_price, status, duration, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW()
      )
    `, [
      course2Id, 
      'tailwind-css-mastery', 
      'Tailwind CSS Crash Course', 
      'Master Tailwind CSS in this free crash course. Build modern, responsive, and beautiful UI components.', 
      'https://placehold.co/1280x720/png?text=Tailwind+Mastery', 
      'https://www.youtube.com/watch?v=_GTMOnLAdXM', // Tailwind tutorial
      'design', 
      0, 
      'active', 
      '1.5 hours'
    ]);
    console.log('Inserted Tailwind free course');
    
  } catch (err) {
    console.error('Error inserting courses:', err);
  } finally {
    await client.end();
  }
}

main();
