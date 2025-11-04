import React, { useState } from 'react';

function App() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    deviceModel: '',
    problemDescription: '',
    priority: 'Low'
  });
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resp, setResp] = useState(null);
  const [errors, setErrors] = useState([]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  function handleFile(e) {
    setImage(e.target.files[0] || null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors([]);
    setResp(null);
    setLoading(true);

    // client-side minimal validation
    const errs = [];
    if (!form.name || form.name.length < 2) errs.push('Name min 2 chars');
    if (!form.email || !/^\S+@\S+\.\S+$/.test(form.email)) errs.push('Valid email required');
    if (!form.deviceModel) errs.push('Device model required');
    if (!form.problemDescription || form.problemDescription.length < 10) errs.push('Problem description min 10 chars');

    if (errs.length) {
      setErrors(errs);
      setLoading(false);
      return;
    }

    const data = new FormData();
    Object.entries(form).forEach(([k, v]) => data.append(k, v));
    if (image) data.append('image', image);

    try {
      const res = await fetch('http://localhost:5000/submit', {
        method: 'POST',
        body: data
      });
      const j = await res.json();
      if (!res.ok) {
        setErrors(j.errors || [j.error] || ['Unknown error']);
      } else {
        setResp(j.submission);
        setForm({ name: '', email: '', phone: '', deviceModel: '', problemDescription: '', priority: 'Low' });
        setImage(null);
      }
    } catch (err) {
      setErrors(['Network error: ' + err.message]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 700, margin: '30px auto', fontFamily: 'Arial, sans-serif' }}>
      <h2>Device Repair Request (React + Express)</h2>
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <label>Name*<br/>
          <input name="name" value={form.name} onChange={handleChange} required />
        </label><br/>
        <label>Email*<br/>
          <input name="email" value={form.email} onChange={handleChange} required />
        </label><br/>
        <label>Phone<br/>
          <input name="phone" value={form.phone} onChange={handleChange} />
        </label><br/>
        <label>Device Model*<br/>
          <input name="deviceModel" value={form.deviceModel} onChange={handleChange} required />
        </label><br/>
        <label>Problem Description*<br/>
          <textarea name="problemDescription" value={form.problemDescription} onChange={handleChange} required />
        </label><br/>
        <label>Priority<br/>
          <select name="priority" value={form.priority} onChange={handleChange}>
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
          </select>
        </label><br/>
        <label>Image (optional)<br/>
          <input type="file" accept="image/*" onChange={handleFile} />
        </label><br/><br/>

        <button type="submit" disabled={loading}>{loading ? 'Submitting...' : 'Submit Request'}</button>
      </form>

      {errors.length > 0 && (
        <div style={{ color: 'darkred', marginTop: 15 }}>
          <b>Errors:</b>
          <ul>{errors.map((e,i) => <li key={i}>{e}</li>)}</ul>
        </div>
      )}

      {resp && (
        <div style={{ marginTop: 15, padding: 12, border: '1px solid #ddd' }}>
          <h4>Success</h4>
          <p>ID: {resp.id}</p>
          <p>Submitted at: {new Date(resp.createdAt).toLocaleString()}</p>
          {resp.image && <p>Image path: <a href={`http://localhost:5000${resp.image}`} target="_blank" rel="noreferrer">view</a></p>}
        </div>
      )}
    </div>
  );
}

export default App;
