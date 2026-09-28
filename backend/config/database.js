'use strict';

const Database = require('better-sqlite3');
const path     = require('path');
const fs       = require('fs');
require('dotenv').config();

const DB_PATH = path.resolve(__dirname, '..', process.env.DATABASE_PATH || './database/jobportal.db');

let db;

function getDb() {
  if (!db) {
    // Ensure the directory exists
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    db = new Database(DB_PATH);

    // Performance and safety pragmas
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    db.pragma('synchronous = NORMAL');

    initializeSchema();
  }
  return db;
}

function initializeSchema() {
  const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schema);
  }
}

module.exports = { getDb };
