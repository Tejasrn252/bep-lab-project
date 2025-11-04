import React, { useEffect, useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import './App.css';
import Submissions from './Submissions.jsx';

export default function App() {
  // theme (light/dark)
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  // form state
  const [form, setForm] = useState({
    name: '', email: '', phone: '', deviceModel: '',
    problemDescription: '', priority: 'Low'
  });
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resp, setResp] = useState(null);
  const [errors, setErrors] = useState([]);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const handleFile = (e) => setImage(e.target.files[0] || null);

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors([]); setResp(null); setLoading(true);

    const errs = [];
    if (!form.name || form.name.length < 2) errs.push('Name min 2 chars');
    if (!form.email || !/^\S+@\S+\.\S+$/.test(form.email)) errs.push('Valid email required');
    if (!form.deviceModel) errs.push('Device model required');
    if (!form.problemDescription || form.problemDescription.length < 10) errs.push('Problem description min 10 chars');
    if (errs.length) { setErrors(errs); setLoading(false); return; }

    const data = new FormData();
    Object.entries(form).forEach(([k, v]) => data.append(k, v));
    if (image) data.append('image', image);

    try {
      const res = await fetch('http://localhost:5000/submit', { method: 'POST', body: data });
      const j = await res.json();
      if (!res.ok) setErrors(j.errors || [j.error] || ['Unknown error']);
      else {
        setResp(j.submission);
        setForm({ name:'', email:'', phone:'', deviceModel:'', problemDescription:'', priority:'Low' });
        setImage(null);
      }
    } catch (err) {
      setErrors(['Network error: ' + err.message]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* NAVBAR */}
      <nav className="navbar">
        <div className="brand">
          <div className="logo">R</div>
          <div>RepairHub</div>
        </div>
        <div className="nav-actions">
          <Link className="theme-toggle" to="/">Form</Link>
          <Link className="theme-toggle" to="/submissions">Submissions</Link>
          <button
            className="theme-toggle"
            onClick={() => setTheme(t => (t === 'dark' ? 'light' : 'dark'))}
          >
            {theme === 'dark' ? '🌞 Light' : '🌙 Dark'}
          </button>
        </div>
      </nav>

      {/* ROUTES */}
      <main className="page">
        <Routes>
          <Route
            path="/"
            element={
              <section className="card">
                <h2 className="h2">Device Repair Request</h2>
                <p className="subtle">React → Express form submission with file upload.</p>

                <form className="form-grid" onSubmit={handleSubmit} encType="multipart/form-data">
                  <div className="two-col">
                    <div>
                      <label>Name*</label>
                      <input name="name" value={form.name} onChange={handleChange} required />
                    </div>
                    <div>
                      <label>Email*</label>
                      <input name="email" value={form.email} onChange={handleChange} required />
                    </div>
                  </div>

                  <div className="two-col">
                    <div>
                      <label>Phone</label>
                      <input name="phone" value={form.phone} onChange={handleChange} />
                    </div>
                    <div>
                      <label>Device Model*</label>
                      <input name="deviceModel" value={form.deviceModel} onChange={handleChange} required />
                    </div>
                  </div>

                  <div>
                    <label>Problem Description*</label>
                    <textarea name="problemDescription" value={form.problemDescription} onChange={handleChange} required />
                  </div>

                  <div className="two-col">
                    <div>
                      <label>Priority</label>
                      <select name="priority" value={form.priority} onChange={handleChange}>
                        <option>Low</option><option>Medium</option><option>High</option>
                      </select>
                    </div>
                    <div>
                      <label>Image (optional)</label>
                      <input type="file" accept="image/*" onChange={handleFile} />
                    </div>
                  </div>

                  <button className="btn" type="submit" disabled={loading}>
                    {loading ? 'Submitting…' : 'Submit Request'}
                  </button>
                </form>

                {errors.length > 0 && (
                  <div className="errors">
                    <strong>Errors:</strong>
                    <ul>{errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
                  </div>
                )}

                {resp && (
                  <div className="success-box">
                    <strong>✅ Submission Successful</strong>
                    <div className="meta">
                      <div><b>ID:</b> {resp.id}</div>
                      <div><b>Time:</b> {new Date(resp.createdAt).toLocaleString()}</div>
                      {resp.image && (
                        <div>
                          <b>Image:</b>{' '}
                          <a className="link" href={`http://localhost:5000${resp.image}`} target="_blank" rel="noreferrer">
                            View Uploaded File
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </section>
            }
          />
          <Route path="/submissions" element={<Submissions />} />
        </Routes>
      </main>

      <footer style={{
        textAlign: 'center',
        padding: '20px',
        fontSize: '14px',
        color: 'var(--text-muted)'
      }}>
        Tejas R N USN:23BTRCT136 · Jain University · BEP Lab Project
      </footer>
    </>
  );
}
