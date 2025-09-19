import { Client } from "node-postgres";
import { Pool } from "pg";
export const client = new Pool({
    user: process.env.EXPO_PUBLIC_DB_USERNAME,
    password: process.env.EXPO_PUBLIC_DB_PASSWORD,
    host: "us-west-2.db.thenile.dev",
    port: 5432,
    database: "wastewise_app",
});