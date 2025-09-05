'use client';
import useSWR from 'swr';
import { useState } from 'react';
const fetcher = (url)=> fetch(url).then(r=>r.json());

export default function Page(){
  const { data, mutate } = useSWR('/api/education', fetcher);
  const [form, setForm] = useState({});

  const create = async ()=>{
    let body = { ...form };
    if(body.tags) body.tags = body.tags.split(',').map(s=>s.trim()).filter(Boolean);
    const res = await fetch('/api/education', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
    if(res.ok){ setForm({}); mutate(); }
  };

  return (
    <div className="card p-4">
      <h1 className="text-2xl font-bold mb-4">จัดการการศึกษา</h1>
      <div className="grid sm:grid-cols-2 gap-3 mb-4">
        <input className="input" placeholder="title" value={form.title||''} onChange={e=>setForm({...form, title:e.target.value})} />
        <textarea className="input h-24" placeholder="รายละเอียด" value={form.content||form.description||''} onChange={e=>setForm({...form, content:e.target.value, description:e.target.value})} />
      </div>
      <button className="btn mb-6" onClick={create}>เพิ่ม</button>
      <ul className="space-y-2">
        {data?.items?.map((it)=> (
          <li key={it._id} className="bg-white/5 p-3 rounded-lg">
            <div className="font-semibold">{it.title || it.slug}</div>
            <div className="text-white/70 text-sm">{it.description || it.excerpt}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
