const express = require('express');
const crypto = require('crypto');
const store = require('./store');

const app = express();
app.use(express.json({ limit: '20kb' }));

const COLORS = ['yellow', 'mint', 'sky', 'rose', 'lilac'];
const MAX_TITLE = 100;
const MAX_CONTENT = 2000;

const router = express.Router();

// GET /notes — list all notes, newest first
router.get('/', async (req, res, next) => {
  try {
    res.json(await store.list());
  } catch (err) {
    next(err);
  }
});

// POST /notes — create a note
router.post('/', async (req, res, next) => {
  try {
    const title = String(req.body?.title ?? '').trim();
    const content = String(req.body?.content ?? '').trim();
    const color = COLORS.includes(req.body?.color) ? req.body.color : 'yellow';

    if (!title && !content) {
      return res.status(400).json({ error: 'Add a title or some text before saving.' });
    }
    if (title.length > MAX_TITLE) {
      return res.status(400).json({ error: `Title can be up to ${MAX_TITLE} characters.` });
    }
    if (content.length > MAX_CONTENT) {
      return res.status(400).json({ error: `Note text can be up to ${MAX_CONTENT} characters.` });
    }

    const note = {
      id: crypto.randomUUID(),
      title,
      content,
      color,
      createdAt: new Date().toISOString(),
    };
    res.status(201).json(await store.create(note));
  } catch (err) {
    next(err);
  }
});

// DELETE /notes/:id — delete one note
router.delete('/:id', async (req, res, next) => {
  try {
    const removed = await store.remove(req.params.id);
    if (!removed) return res.status(404).json({ error: 'That note no longer exists.' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// Mounted on both /api/notes (used by the frontend) and /notes (matches the spec).
app.use(['/api/notes', '/notes'], router);

app.get(['/api/health', '/health'], (req, res) => {
  res.json({ ok: true, storage: store.mode });
});

app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Request body must be valid JSON.' });
  }
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server. Try again.' });
});

module.exports = app;
