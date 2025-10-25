import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });
import type { Knex } from "knex";
console.log(process.env.DATABASE_URL ,"oo")
const config: { [key: string]: Knex.Config } = {
  development: {
    client: "pg",
    connection: {
      connectionString: process.env.DATABASE_URL || "",
      ssl: { rejectUnauthorized: false }, // 👈 allow self-signed cert
    },
    migrations: {
      directory: "./migrations",
      extension: "ts",
    },
    seeds: {
      directory: "./seeds",
      extension: "ts",
    },

  },
};

export default config;
