import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Return DATE columns as plain 'YYYY-MM-DD' text (avoids timezone shifts)
pg.types.setTypeParser(1082, (value) => value);

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

export default pool;