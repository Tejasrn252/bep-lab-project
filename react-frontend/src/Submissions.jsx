import React, { useEffect, useState } from 'react';

export default function Submissions() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('http://localhost:5000/submissions');
        if (!res.ok) throw new Error('Failed to fetch submissions');
        const data = await res.json();
        setRows(Array.isArray(data) ? data.reverse() : []);
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="card"><b>Loading…</b></div>;
  if (err) return <div className="card errors">Error: {err}</div>;
  if (rows.length === 0) return <div className="card">No submissions yet.</div>;

  return (
    <section className="card" style={{overflowX:'auto'}}>
      <h2 className="h2">All Submissions</h2>
      <p className="subtle">Fetched from <code>/submissions</code></p>

      <table style={{width:'100%', borderCollapse:'collapse'}}>
        <thead>
          <tr>
            <Th>Name</Th><Th>Email</Th><Th>Model</Th><Th>Priority</Th>
            <Th>Problem</Th><Th>Image</Th><Th>Time</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} style={{borderTop:'1px solid var(--border)'}}>
              <Td>{r.name}</Td>
              <Td>{r.email}</Td>
              <Td>{r.deviceModel}</Td>
              <Td>{r.priority}</Td>
              <Td style={{minWidth:240}}>{r.problemDescription}</Td>
              <Td>
                {r.image ? (
                  <a className="link" href={`http://localhost:5000${r.image}`} target="_blank" rel="noreferrer">
                    View
                  </a>
                ) : '—'}
              </Td>
              <Td>{new Date(r.createdAt).toLocaleString()}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

/* small helpers for consistent table paddings */
function Th({children}) {
  return <th style={{textAlign:'left', padding:'10px 8px', background:'var(--bg)'}}>{children}</th>;
}
function Td({children}) {
  return <td style={{padding:'10px 8px', verticalAlign:'top'}}>{children}</td>;
}
