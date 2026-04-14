import app from "../src/app";
import { connectToDatabase } from "../src/config/database";

let dbInitPromise: Promise<boolean> | null = null;

async function ensureDatabaseConnection(): Promise<void> {
  if (!dbInitPromise) {
    dbInitPromise = connectToDatabase();
  }

  await dbInitPromise;
}

export default async function handler(req: any, res: any): Promise<void> {
  await ensureDatabaseConnection();
  app(req, res);
}
