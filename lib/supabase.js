import postgres from 'postgres';
import "dotenv/config";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "Missing DATABASE_URL. Please check DATABASE_URL in .env file."
  );
}

const sql = postgres(connectionString);

export default sql;
