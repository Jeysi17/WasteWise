const { Pool } = require('pg');

const pool = new Pool({
  user: "01971842-d24f-7abd-ace2-a2ff5c9d83cf",
  password: "b4a6c17e-b03a-46a1-b720-23ae0dfc8ce5",
  host: "us-west-2.db.thenile.dev",
  port: 5432,
  database: "wastewise_app",
  ssl: { rejectUnauthorized: false },
});

module.exports = pool;