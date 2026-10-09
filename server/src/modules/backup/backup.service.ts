import mongoose from "mongoose";
import { cloudinary } from "../../config/cloudinary.js";
import { logger } from "../../lib/logger.js";
import { revalidate } from "../../services/revalidate.js";
import { badRequest } from "../../utils/app-error.js";

const { EJSON } = mongoose.mongo.BSON;

export const BACKUP_FORMAT = "krunal-portfolio-backup";
export const BACKUP_VERSION = 1;
const BACKUP_FOLDER = "portfolio/backups";
const KEEP = 7;

/**
 * Not exported/imported: credentials and sessions (restoring them would sign you out or lock
 * you out), plus high-volume operational data that isn't content.
 */
const EXCLUDED = new Set(["admins", "refreshTokens", "events", "revisions", "auditLogs"]);

/** Every cache tag the site uses: an import can touch anything. */
const ALL_TAGS = [
  "settings",
  "homepage",
  "about",
  "experiences",
  "projects",
  "skills",
  "case-studies",
  "engineering",
  "built",
  "testimonials",
  "achievements",
  "certifications",
  "resumes",
  "posts",
  "github",
  "redirects",
  "pages",
  "seo",
];

type BackupFile = {
  format: string;
  version: number;
  createdAt: string;
  collections: Record<string, unknown[]>;
};

async function contentCollections() {
  const db = mongoose.connection.db;
  if (!db) throw new Error("Database not connected");
  const names = (await db.listCollections({}, { nameOnly: true }).toArray())
    .map((c) => c.name)
    .filter((name) => !EXCLUDED.has(name) && !name.startsWith("system."));
  return { db, names: names.sort() };
}

/** All content as Extended JSON (keeps ObjectIds and dates exact for a faithful restore). */
export async function exportAll(): Promise<string> {
  const { db, names } = await contentCollections();
  const collections: Record<string, unknown[]> = {};
  for (const name of names) collections[name] = await db.collection(name).find({}).toArray();
  const file: BackupFile = {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    createdAt: new Date().toISOString(),
    collections,
  };
  return EJSON.stringify(file, undefined, 0, { relaxed: false });
}

const stamp = () => new Date().toISOString().replace(/[:.]/g, "-").replace("T", "_").slice(0, 19);

/**
 * Nightly backup (portfolio.md §13.3): upload a JSON export to Cloudinary as a *private* raw
 * file (only downloadable through a signed, expiring link) and keep the newest 7.
 */
export async function runBackup(reason = "nightly") {
  const json = await exportAll();
  const publicId = `backup-${stamp()}${reason === "nightly" ? "" : `-${reason}`}.json`;
  const result = await new Promise<{ public_id: string; bytes: number }>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          resource_type: "raw",
          type: "private",
          folder: BACKUP_FOLDER,
          public_id: publicId,
          overwrite: false,
          use_filename: false,
        },
        (error, res) =>
          error || !res ? reject(error ?? new Error("Upload failed")) : resolve(res),
      )
      .end(Buffer.from(json, "utf8"));
  });
  const deleted = await pruneBackups();
  logger.info({ publicId: result.public_id, bytes: result.bytes, deleted }, "Backup stored");
  return { publicId: result.public_id, bytes: result.bytes, deleted };
}

type CloudinaryResource = { public_id: string; bytes: number; created_at: string };

export async function listBackups() {
  const res = (await cloudinary.api.resources({
    resource_type: "raw",
    type: "private",
    prefix: `${BACKUP_FOLDER}/`,
    max_results: 100,
  })) as { resources: CloudinaryResource[] };
  return res.resources
    .map((r) => ({ publicId: r.public_id, bytes: r.bytes, createdAt: r.created_at }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

async function pruneBackups() {
  const stale = (await listBackups()).slice(KEEP).map((b) => b.publicId);
  if (stale.length) {
    await cloudinary.api.delete_resources(stale, { resource_type: "raw", type: "private" });
  }
  return stale.length;
}

/** Signed link valid for 10 minutes. */
export function backupDownloadUrl(publicId: string) {
  if (!publicId.startsWith(`${BACKUP_FOLDER}/`)) throw badRequest("Not a backup file");
  return cloudinary.utils.private_download_url(publicId, "", {
    resource_type: "raw",
    type: "private",
    attachment: true,
    expires_at: Math.floor(Date.now() / 1000) + 600,
  });
}

export type ImportMode = "replace" | "merge";
type ImportReport = {
  dryRun: boolean;
  mode: ImportMode;
  createdAt: string | null;
  collections: {
    name: string;
    incoming: number;
    existing: number;
    /** replace: delete existing then insert; merge: insert new ids, overwrite matching ids. */
    inserted: number;
    updated: number;
    removed: number;
    invalid: number;
    errors: string[];
  }[];
  skipped: string[];
};

/** Mongoose model for a collection name, if one is registered (used for validation). */
function modelFor(collection: string) {
  return mongoose
    .modelNames()
    .map((n) => mongoose.model(n))
    .find((m) => m.collection.collectionName === collection);
}

/**
 * Restores content from an export/backup (portfolio.md §15 Phase 7). Always validate with
 * `dryRun` first: it reports exactly what would change without writing anything. A real
 * import first stores a "pre-import" backup so it can itself be undone.
 */
export async function importAll(raw: string, options: { dryRun: boolean; mode: ImportMode }) {
  let file: BackupFile;
  try {
    file = EJSON.parse(raw, { relaxed: false }) as BackupFile;
  } catch {
    throw badRequest("Not valid JSON");
  }
  if (file?.format !== BACKUP_FORMAT || typeof file.collections !== "object") {
    throw badRequest("This isn't a portfolio export/backup file");
  }
  if (file.version > BACKUP_VERSION) throw badRequest("Backup is from a newer version");

  const { db, names } = await contentCollections();
  const known = new Set([
    ...names,
    ...mongoose.modelNames().map((n) => mongoose.model(n).collection.collectionName),
  ]);
  const report: ImportReport = {
    dryRun: options.dryRun,
    mode: options.mode,
    createdAt: file.createdAt ?? null,
    collections: [],
    skipped: [],
  };

  for (const [name, docs] of Object.entries(file.collections)) {
    if (EXCLUDED.has(name) || !known.has(name) || !Array.isArray(docs)) {
      report.skipped.push(name);
      continue;
    }
    const collection = db.collection(name);
    const ids = docs.map((d) => (d as { _id?: unknown })._id).filter(Boolean);
    const [existing, matching] = await Promise.all([
      collection.countDocuments({}),
      ids.length ? collection.countDocuments({ _id: { $in: ids as never[] } }) : 0,
    ]);

    // Validate against the Mongoose schema where there is one.
    const model = modelFor(name);
    const errors: string[] = [];
    let invalid = 0;
    if (model) {
      for (const doc of docs) {
        const err = new model(doc).validateSync();
        if (err) {
          invalid++;
          if (errors.length < 3) errors.push(err.message.slice(0, 200));
        }
      }
    }
    report.collections.push({
      name,
      incoming: docs.length,
      existing,
      inserted: options.mode === "replace" ? docs.length : docs.length - matching,
      updated: options.mode === "replace" ? 0 : matching,
      removed: options.mode === "replace" ? existing : 0,
      invalid,
      errors,
    });
  }

  const totalInvalid = report.collections.reduce((n, c) => n + c.invalid, 0);
  if (options.dryRun) return report;
  if (totalInvalid)
    throw badRequest("The file has invalid documents; run a dry run to see them", report);

  try {
    await runBackup("pre-import");
  } catch (err) {
    logger.warn({ err }, "Pre-import backup failed; continuing with import");
  }

  for (const { name } of report.collections) {
    const docs = file.collections[name] as Record<string, unknown>[];
    const collection = db.collection(name);
    if (options.mode === "replace") {
      await collection.deleteMany({});
      if (docs.length) await collection.insertMany(docs as never[]);
    } else if (docs.length) {
      await collection.bulkWrite(
        docs.map((doc) => ({
          replaceOne: {
            filter: { _id: doc._id as never },
            replacement: doc as never,
            upsert: true,
          },
        })),
      );
    }
  }
  void revalidate({ tags: ALL_TAGS });
  return report;
}
