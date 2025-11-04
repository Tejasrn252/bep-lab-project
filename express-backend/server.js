const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Simple API key for Postman task (you can set in env or leave default)
const API_KEY = process.env.API_KEY || 'TEST_API_KEY_123';

// Create uploads folder if not exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ts = Date.now();
    const safe = file.originalname.replace(/\s+/g, '_');
    cb(null, `${ts}_${safe}`);
  }
});
const upload = multer({ storage });

// Allow JSON and CORS (for React running on different port)
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Helper: submissions file path
const SUBMISSIONS_FILE = path.join(__dirname, 'submissions.json');

// Simple function to append submission to submissions.json
function saveSubmission(obj) {
  let arr = [];
  if (fs.existsSync(SUBMISSIONS_FILE)) {
    try { arr = JSON.parse(fs.readFileSync(SUBMISSIONS_FILE, 'utf-8')); } catch { arr = []; }
  }
  arr.push(obj);
  fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify(arr, null, 2));
}

// GET health check
app.get('/', (req, res) => res.json({ ok: true, msg: 'BEP Lab backend running' }));

// ---------- READ SUBMISSIONS (NEW) ----------

// Return all submissions as JSON (used by React /submissions page)
app.get('/submissions', (req, res) => {
  if (!fs.existsSync(SUBMISSIONS_FILE)) return res.json([]);
  try {
    const data = JSON.parse(fs.readFileSync(SUBMISSIONS_FILE, 'utf-8'));
    res.json(data);
  } catch (err) {
    console.error('Read submissions error:', err);
    res.status(500).json({ error: 'Failed to read submissions' });
  }
});

// Pretty HTML table view (nice for viva/demo)
app.get('/submissions/view', (req, res) => {
  if (!fs.existsSync(SUBMISSIONS_FILE)) return res.send('<h3 style="font-family:Arial">No submissions yet</h3>');
  const data = JSON.parse(fs.readFileSync(SUBMISSIONS_FILE, 'utf-8'));
  let html = `
  <html>
  <head><title>Submissions</title>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <style>
    body{font-family:Arial,Helvetica,sans-serif;padding:20px;background:#f7f9fc}
    h2{margin:0 0 10px}
    table{border-collapse:collapse;width:100%;margin-top:10px}
    th,td{border:1px solid #ddd;padding:8px;text-align:left;vertical-align:top}
    th{background:#e3f2fd}
    tr:nth-child(even){background:#fafafa}
    img{max-width:80px;border-radius:6px}
    code{background:#eef;padding:2px 4px;border-radius:4px}
  </style></head><body>
  <h2>📋 Repair Request Submissions</h2>
  <p>API source: <code>/submissions</code></p>
  <table>
    <tr><th>Name</th><th>Email</th><th>Model</th><th>Priority</th><th>Problem</th><th>Image</th><th>Date</th></tr>`;
  data.forEach(s => {
    html += `<tr>
      <td>${escapeHtml(s.name)}</td>
      <td>${escapeHtml(s.email)}</td>
      <td>${escapeHtml(s.deviceModel)}</td>
      <td>${escapeHtml(s.priority || '')}</td>
      <td style="min-width:240px">${escapeHtml(s.problemDescription)}</td>
      <td>${s.image ? `<a href="${s.image}" target="_blank">View</a>` : '—'}</td>
      <td>${new Date(s.createdAt).toLocaleString()}</td>
    </tr>`;
  });
  html += `</table></body></html>`;
  res.send(html);
});
function escapeHtml(str=''){
  return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
}

// ---------- WRITE SUBMISSIONS ----------

// Protected endpoint used for Postman exercise (requires x-api-key header)
app.post('/submit-with-apikey', upload.single('image'), (req, res) => {
  const key = req.header('x-api-key') || req.header('authorization');
  if (!key || ![API_KEY, `Bearer ${API_KEY}`].includes(key)) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  handleSubmission(req, res);
});

// Primary submission endpoint (open for React form)
app.post('/submit', upload.single('image'), (req, res) => {
  handleSubmission(req, res);
});

function handleSubmission(req, res) {
  // Form fields: name, email, phone, deviceModel, problemDescription, priority
  const { name, email, phone, deviceModel, problemDescription, priority } = req.body;

  // SERVER-SIDE VALIDATION
  const errors = [];
  if (!name || name.trim().length < 2) errors.push('Name is required (min 2 chars).');
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) errors.push('Valid email required.');
  if (!deviceModel) errors.push('Device model is required.');
  if (!problemDescription || problemDescription.trim().length < 10) errors.push('Problem description (min 10 chars).');

  if (errors.length) return res.status(400).json({ errors });

  // Build submission object
  const submission = {
    id: Date.now().toString(36),
    name: name.trim(),
    email: email.trim(),
    phone: phone ? String(phone).trim() : null,
    deviceModel: deviceModel.trim(),
    problemDescription: problemDescription.trim(),
    priority: priority || 'Low',
    image: req.file ? `/uploads/${path.basename(req.file.path)}` : null,
    createdAt: new Date().toISOString()
  };

  try {
    saveSubmission(submission);
    return res.json({ ok: true, submission });
  } catch (err) {
    console.error('Save error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Serve uploaded files (for demo)
app.use('/uploads', express.static(uploadsDir));

// Start server
app.listen(PORT, () => {
  console.log(`BEP backend listening on http://localhost:${PORT}`);
  console.log(`Use API key: ${API_KEY} (for Postman endpoint /submit-with-apikey)`);
});
