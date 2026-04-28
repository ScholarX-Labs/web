import pg from 'pg';
const { Client } = pg;

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false
  });
  
  try {
    await client.connect();
    console.log('Connected to database');
    
    // Truncate the subscriptions table to remove orphans
    console.log('Truncating courses.subscriptions...');
    await client.query('TRUNCATE TABLE courses.subscriptions CASCADE;');
    console.log('Successfully truncated courses.subscriptions');
    
  } catch (err) {
    console.error('Error executing query:', err);
  } finally {
    await client.end();
  }
}

main();
