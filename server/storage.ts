import {
  normalizeTelegramUsername,
  type InsertRsvp,
  type StoredRsvp,
} from "@shared/rsvp";
import { type User, type InsertUser } from "@shared/schema";
import { randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { Pool } from "pg";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createRsvp(rsvp: InsertRsvp): Promise<StoredRsvp>;
  getRsvpByTelegram(telegram: string): Promise<StoredRsvp | undefined>;
  listRsvps(): Promise<StoredRsvp[]>;
}

export class DuplicateTelegramRsvpError extends Error {
  readonly telegram: string;

  constructor(telegram: string) {
    super(`RSVP with telegram ${normalizeTelegramUsername(telegram)} already exists`);
    this.name = "DuplicateTelegramRsvpError";
    this.telegram = normalizeTelegramUsername(telegram);
  }
}

type RsvpRow = {
  id: string;
  full_name: string;
  telegram: string;
  phone: string;
  transfer: InsertRsvp["transfer"];
  drinks: InsertRsvp["drinks"];
  created_at: Date | string;
};

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private pool: Pool | null;
  private rsvpFilePath: string;
  private rsvpStoreReady: Promise<void>;
  private rsvpWriteQueue: Promise<void>;

  constructor() {
    this.users = new Map();
    this.pool = process.env.DATABASE_URL
      ? new Pool({ connectionString: process.env.DATABASE_URL })
      : null;
    this.rsvpFilePath = path.resolve(process.cwd(), "data", "rsvps.json");
    this.rsvpStoreReady = this.initializeRsvpStore();
    this.rsvpWriteQueue = Promise.resolve();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createRsvp(insertRsvp: InsertRsvp): Promise<StoredRsvp> {
    await this.rsvpStoreReady;

    if (this.pool) {
      return this.createRsvpInDatabase(insertRsvp);
    }

    return this.createRsvpInFile(insertRsvp);
  }

  async listRsvps(): Promise<StoredRsvp[]> {
    await this.rsvpStoreReady;

    if (this.pool) {
      return this.listRsvpsFromDatabase();
    }

    await this.rsvpWriteQueue;
    return this.readRsvpsFromFile();
  }

  async getRsvpByTelegram(telegram: string): Promise<StoredRsvp | undefined> {
    await this.rsvpStoreReady;

    if (this.pool) {
      return this.getRsvpByTelegramFromDatabase(telegram);
    }

    await this.rsvpWriteQueue;
    const normalizedTelegram = normalizeTelegramUsername(telegram);
    const rsvps = await this.readRsvpsFromFile();
    return rsvps.find(
      (rsvp) => normalizeTelegramUsername(rsvp.telegram) === normalizedTelegram,
    );
  }

  private async initializeRsvpStore() {
    if (this.pool) {
      try {
        await this.initializeDatabaseStore();
        return;
      } catch (error) {
        console.error("Failed to initialize PostgreSQL for RSVP storage.", error);
        throw error;
      }
    }

    await mkdir(path.dirname(this.rsvpFilePath), { recursive: true });
    await this.ensureRsvpFileExists();
  }

  private async initializeDatabaseStore() {
    if (!this.pool) {
      throw new Error("RSVP database connection is not available");
    }

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS rsvps (
        id varchar(64) PRIMARY KEY,
        full_name text NOT NULL,
        telegram text NOT NULL,
        phone text NOT NULL,
        transfer text NOT NULL,
        drinks text[] NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await this.pool.query(`
      ALTER TABLE rsvps
      ADD COLUMN IF NOT EXISTS telegram text
    `);
    await this.pool.query(`
      ALTER TABLE rsvps
      ADD COLUMN IF NOT EXISTS phone text
    `);
    await this.ensureNormalizedTelegramValues();
    await this.ensureUniqueTelegramIndex();
  }

  private async ensureNormalizedTelegramValues() {
    if (!this.pool) {
      throw new Error("RSVP database connection is not available");
    }

    const duplicateResult = await this.pool.query<{
      normalized_telegram: string;
      count: string;
    }>(`
      SELECT
        CASE
          WHEN telegram LIKE '@%' THEN lower(telegram)
          ELSE '@' || lower(telegram)
        END AS normalized_telegram,
        COUNT(*)::text AS count
      FROM rsvps
      GROUP BY 1
      HAVING COUNT(*) > 1
      LIMIT 1
    `);

    const duplicateTelegram = duplicateResult.rows[0];

    if (duplicateTelegram) {
      throw new Error(
        `Cannot enforce unique RSVP telegram usernames because duplicate records already exist for ${duplicateTelegram.normalized_telegram}.`,
      );
    }

    await this.pool.query(`
      UPDATE rsvps
      SET telegram = CASE
        WHEN telegram LIKE '@%' THEN lower(telegram)
        ELSE '@' || lower(telegram)
      END
      WHERE telegram <> CASE
        WHEN telegram LIKE '@%' THEN lower(telegram)
        ELSE '@' || lower(telegram)
      END
    `);
  }

  private async ensureUniqueTelegramIndex() {
    if (!this.pool) {
      throw new Error("RSVP database connection is not available");
    }

    await this.pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS rsvps_telegram_lower_unique_idx
      ON rsvps (lower(telegram))
    `);
  }

  private async createRsvpInDatabase(
    insertRsvp: InsertRsvp,
  ): Promise<StoredRsvp> {
    if (!this.pool) {
      throw new Error("RSVP database connection is not available");
    }

    const id = randomUUID();
    const createdAt = new Date().toISOString();
    const normalizedTelegram = normalizeTelegramUsername(insertRsvp.telegram);
    const result = await this.pool.query<RsvpRow>(
      `
        INSERT INTO rsvps (
          id,
          full_name,
          telegram,
          phone,
          transfer,
          drinks,
          created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT DO NOTHING
        RETURNING id, full_name, telegram, phone, transfer, drinks, created_at
      `,
      [
        id,
        insertRsvp.fullName,
        normalizedTelegram,
        insertRsvp.phone,
        insertRsvp.transfer,
        insertRsvp.drinks,
        createdAt,
      ],
    );

    const savedRsvp = result.rows[0];

    if (!savedRsvp) {
      throw new DuplicateTelegramRsvpError(normalizedTelegram);
    }

    return this.mapStoredRsvpRow(savedRsvp);
  }

  private async createRsvpInFile(insertRsvp: InsertRsvp): Promise<StoredRsvp> {
    return this.enqueueRsvpFileWrite(async () => {
      const normalizedTelegram = normalizeTelegramUsername(insertRsvp.telegram);
      const currentRsvps = await this.readRsvpsFromFile();

      if (
        currentRsvps.some(
          (rsvp) => normalizeTelegramUsername(rsvp.telegram) === normalizedTelegram,
        )
      ) {
        throw new DuplicateTelegramRsvpError(normalizedTelegram);
      }

      const savedRsvp: StoredRsvp = {
        id: randomUUID(),
        createdAt: new Date().toISOString(),
        ...insertRsvp,
        telegram: normalizedTelegram,
      };

      currentRsvps.push(savedRsvp);
      await writeFile(
        this.rsvpFilePath,
        `${JSON.stringify(currentRsvps, null, 2)}\n`,
        "utf8",
      );

      return savedRsvp;
    });
  }

  private async listRsvpsFromDatabase(): Promise<StoredRsvp[]> {
    if (!this.pool) {
      throw new Error("RSVP database connection is not available");
    }

    const result = await this.pool.query<RsvpRow>(
      `
        SELECT id, full_name, telegram, phone, transfer, drinks, created_at
        FROM rsvps
        ORDER BY created_at ASC
      `,
    );

    return result.rows.map((savedRsvp: RsvpRow) => this.mapStoredRsvpRow(savedRsvp));
  }

  private async getRsvpByTelegramFromDatabase(
    telegram: string,
  ): Promise<StoredRsvp | undefined> {
    if (!this.pool) {
      throw new Error("RSVP database connection is not available");
    }

    const normalizedTelegram = normalizeTelegramUsername(telegram);
    const result = await this.pool.query<RsvpRow>(
      `
        SELECT id, full_name, telegram, phone, transfer, drinks, created_at
        FROM rsvps
        WHERE lower(telegram) = $1
        LIMIT 1
      `,
      [normalizedTelegram],
    );

    const savedRsvp = result.rows[0];

    if (!savedRsvp) {
      return undefined;
    }

    return this.mapStoredRsvpRow(savedRsvp);
  }

  private async readRsvpsFromFile(): Promise<StoredRsvp[]> {
    await this.ensureRsvpFileExists();
    const rawFile = await readFile(this.rsvpFilePath, "utf8");
    const parsed = JSON.parse(rawFile);
    return Array.isArray(parsed) ? (parsed as StoredRsvp[]) : [];
  }

  private async ensureRsvpFileExists() {
    try {
      await readFile(this.rsvpFilePath, "utf8");
    } catch (error) {
      const isMissingFile =
        error instanceof Error &&
        "code" in error &&
        error.code === "ENOENT";

      if (!isMissingFile) {
        throw error;
      }

      await writeFile(this.rsvpFilePath, "[]\n", "utf8");
    }
  }

  private async enqueueRsvpFileWrite<T>(
    operation: () => Promise<T>,
  ): Promise<T> {
    const nextOperation = this.rsvpWriteQueue.then(operation, operation);
    this.rsvpWriteQueue = nextOperation.then(
      () => undefined,
      () => undefined,
    );
    return nextOperation;
  }

  private mapStoredRsvpRow(savedRsvp: RsvpRow): StoredRsvp {
    return {
      id: savedRsvp.id,
      fullName: savedRsvp.full_name,
      telegram: normalizeTelegramUsername(savedRsvp.telegram),
      phone: savedRsvp.phone,
      transfer: savedRsvp.transfer,
      drinks: savedRsvp.drinks,
      createdAt: new Date(savedRsvp.created_at).toISOString(),
    };
  }
}

export const storage = new MemStorage();
