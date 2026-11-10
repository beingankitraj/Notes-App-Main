const API = '/api/notes';

const form = document.getElementById('form');
const grid = document.getElementById('grid');
const statusEl = document.getElementById('status');
const countEl = document.getElementById('count');
const errorEl = document.getElementById('error');
const saveBtn = document.getElementById('save');
const banner = document.getElementById('banner');

const dateFmt = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

let notes = [];

async function request(url, options) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (res.status === 204) return null;
  let data = null;
  try { data = await res.json(); } catch { /* non-JSON response */ }
  if (!res.ok) throw new Error(data?.error || `Request failed (${res.status}).`);
  return data;
}

function showError(message) {
  errorEl.textContent = message || '';
  errorEl.hidden = !message;
}

function render(addedId) {
  grid.replaceChildren();
  countEl.textContent = notes.length ? `${notes.length} ${notes.length === 1 ? 'note' : 'notes'}` : '';
  statusEl.textContent = notes.length ? '' : 'No notes yet. Write one on the left and press Save note.';

  for (const note of notes) {
    const li = document.createElement('li');
    li.className = `note ${note.color}${note.id === addedId ? ' added' : ''}`;

    if (note.title) {
      const h = document.createElement('h3');
      h.textContent = note.title;
      li.append(h);
    }
    if (note.content) {
      const p = document.createElement('p');
      p.textContent = note.content;
      li.append(p);
    }

    const footer = document.createElement('footer');
    const time = document.createElement('time');
    time.dateTime = note.createdAt;
    time.textContent = dateFmt.format(new Date(note.createdAt));

    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'delete';
    del.textContent = 'Delete';
    del.setAttribute('aria-label', `Delete note${note.title ? ` “${note.title}”` : ''}`);
    del.addEventListener('click', () => deleteNote(note.id, del));

    footer.append(time, del);
    li.append(footer);
    grid.append(li);
  }
}

async function loadNotes() {
  try {
    notes = await request(API);
    render();
  } catch (err) {
    statusEl.textContent = `Could not load notes: ${err.message}`;
  }
}

async function createNote(event) {
  event.preventDefault();
  showError('');
  const data = new FormData(form);
  const payload = {
    title: data.get('title').trim(),
    content: data.get('content').trim(),
    color: data.get('color'),
  };

  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving…';
  try {
    const note = await request(API, { method: 'POST', body: JSON.stringify(payload) });
    notes.unshift(note);
    render(note.id);
    form.reset();
    document.getElementById('title').focus();
  } catch (err) {
    showError(err.message);
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save note';
  }
}

async function deleteNote(id, button) {
  button.disabled = true;
  try {
    await request(`${API}/${encodeURIComponent(id)}`, { method: 'DELETE' });
    notes = notes.filter((n) => n.id !== id);
    render();
  } catch (err) {
    button.disabled = false;
    statusEl.textContent = `Could not delete the note: ${err.message}`;
  }
}

async function checkStorage() {
  try {
    const health = await request('/api/health');
    banner.hidden = health?.storage !== 'ephemeral';
  } catch { /* banner stays hidden */ }
}

form.addEventListener('submit', createNote);
loadNotes();
checkStorage();
