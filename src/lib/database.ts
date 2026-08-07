import Database from "@tauri-apps/plugin-sql";

const DATABASE_URL = "sqlite:rakit.db";

export async function verifyDatabaseConnection() {
  const database = await Database.load(DATABASE_URL);
  const rows = await database.select<{ connection_test: number }[]>(
    "SELECT 1 AS connection_test",
  );

  if (rows[0]?.connection_test !== 1) {
    throw new Error("SQLite connection test returned an unexpected result.");
  }
}