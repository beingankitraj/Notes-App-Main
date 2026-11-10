// Storage layer.
//  - Production (Vercel): Upstash Redis via REST (persistent). Add it from the Vercel Marketplace / Storage tab.
//  - Local dev: JSON file at ./data/notes.json.
//  - Vercel without Redis configured: /tmp JSON file (works for a demo but is NOT persistent).
const fs = require('fs');
const path = require('path');

const REST_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REST_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const HASH_KEY = 'notes:v1';

const useRedis = Boolean(REST_URL && REST_TOKEN);
const onVercel = Boolean(process.env.VERCEL);
const FILE = onVercel
  ? '/tmp/notes.json'
  : path.join(__dirname, '..', 'data', 'notes.json');

const mode = useRedis ? 'persistent' : onVercel ? 'ephemeral' : 'local-file';

async function redis(command) {
  const res = await fetch(REST_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REST_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
  });
  if (!res.ok) throw new Error(`Database request failed (${res.status})`);
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.result;
}

function readFile() {
  try {
    return JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } catch {
    return [];
  }
}

function writeFile(notes) {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(notes, null, 2));
}

const newestFirst = (a, b) => b.createdAt.localeCompare(a.createdAt);

async function list() {
  if (useRedis) {
    const rows = (await redis(['HVALS', HASH_KEY])) || [];
    return rows.map((r) => JSON.parse(r)).sort(newestFirst);
  }
  return readFile().sort(newestFirst);
}

async function create(note) {
  if (useRedis) {
    await redis(['HSET', HASH_KEY, note.id, JSON.stringify(note)]);
  } else {
    const notes = readFile();
    notes.push(note);
    writeFile(notes);
  }
  return note;
}

async function remove(id) {
  if (useRedis) {
    return (await redis(['HDEL', HASH_KEY, id])) > 0;
  }
  const notes = readFile();
  const next = notes.filter((n) => n.id !== id);
  if (next.length === notes.length) return false;
  writeFile(next);
  return true;
}

module.exports = { list, create, remove, mode };
