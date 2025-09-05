'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage(){
  const r = useRouter();
  const [username,setU]=useState('admin');
  const [password,setP]=useState('admin');
  const [err,setErr]=useState('');

  const login=async()=>{
    setErr('');
    const res=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username,password})});
    const data=await res.json();
    if(!res.ok){
      setErr(data.error||'เข้าสู่ระบบล้มเหลว');
      return;
    }
    if(data.mustChangePassword) {
      window.location.href = '/admin/change-password';
    } else {
      window.location.href = '/admin';
    }
  };

  return (
    <div className="card max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">เข้าสู่ระบบผู้ดูแล</h1>
      {err && <div className="text-red-400 mb-2">{err}</div>}
      <label className="label">ชื่อผู้ใช้</label>
      <input className="input mb-3" value={username} onChange={e=>setU(e.target.value)}/>
      <label className="label">รหัสผ่าน</label>
      <input type="password" className="input mb-4" value={password} onChange={e=>setP(e.target.value)}/>
      <button className="btn w-full" onClick={login}>เข้าสู่ระบบ</button>
    </div>
  );
}
