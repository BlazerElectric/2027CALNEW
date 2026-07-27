import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

// Packages available for sponsorship
export const PACKAGES = [
  {
    id: "three-month-view",
    label: "3-Month View Calendar",
    price: 3000,
    popular: true,
  },
  {
    id: "desk-pad",
    label: "Desk Pad Calendar",
    price: 2000,
    popular: false,
  },
  {
    id: "wall-muscle-car",
    label: "1-Month Wall Calendar: Muscle Car Theme",
    price: 1000,
    popular: false,
  },
  {
    id: "wall-wildlife",
    label: "1-Month Wall Calendar: Wildlife Theme",
    price: 1000,
    popular: false,
  },
  {
    id: "wall-golf",
    label: "1-Month Wall Calendar: Golf Theme",
    price: 1000,
    popular: false,
  },
] as const;

export type PackageId = (typeof PACKAGES)[number]["id"];

export interface Submission {
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  packageId: PackageId;
  submittedAt: string;
}

// Determine the database file path.
// During development it lives at <project-root>/data; in production use /tmp
// (writable on most serverless platforms such as Vercel).
// The path segments are kept explicit so Turbopack's file-tracing heuristic
// does not flag the whole project as traced.
function getDbPath(): string {
  let dataDir: string;

  if (process.env.DB_DIR) {
    dataDir = process.env.DB_DIR;
  } else if (process.env.NODE_ENV === "production") {
    dataDir = "/tmp";
  } else {
    // Use an explicit join so the path is statically traceable
    dataDir = path.join(/*turbopackIgnore: true*/ process.cwd(), "data");
  }

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  return path.join(dataDir, "sponsorships.db");
}

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (_db) return _db;

  _db = new Database(getDbPath());

  // Enable WAL mode for better concurrent read performance
  _db.pragma("journal_mode = WAL");
  _db.pragma("synchronous = NORMAL");

  // Create the claims table
  _db.exec(`
    CREATE TABLE IF NOT EXISTS claims (
      package_id TEXT PRIMARY KEY,
      company_name TEXT NOT NULL,
      contact_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      submitted_at TEXT NOT NULL
    )
  `);

  return _db;
}

/**
 * Returns the set of package IDs that have already been claimed.
 */
export function getClaimedPackageIds(): string[] {
  const db = getDb();
  const rows = db.prepare("SELECT package_id FROM claims").all() as {
    package_id: string;
  }[];
  return rows.map((r) => r.package_id);
}

/**
 * Attempts to atomically claim a package for a vendor.
 *
 * Returns `true` if the claim succeeded, `false` if the spot was
 * already taken (race-condition protection via PRIMARY KEY conflict).
 */
export function claimPackage(submission: Submission): boolean {
  const db = getDb();

  const insert = db.prepare(`
    INSERT OR IGNORE INTO claims
      (package_id, company_name, contact_name, email, phone, submitted_at)
    VALUES
      (@packageId, @companyName, @contactName, @email, @phone, @submittedAt)
  `);

  const result = insert.run({
    packageId: submission.packageId,
    companyName: submission.companyName,
    contactName: submission.contactName,
    email: submission.email,
    phone: submission.phone ?? null,
    submittedAt: submission.submittedAt,
  });

  // changes === 1 means the row was inserted (claim succeeded)
  return result.changes === 1;
}
