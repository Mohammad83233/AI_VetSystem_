import React, { useState } from 'react';

const Register = ({ onBackToLogin }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    vetId: '',
    email: '', // New field added to state
    password: '',
    role: 'Doctor' 
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:8000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        alert("✅ " + formData.role + " Account Created Successfully!");
        onBackToLogin();
      } else {
        const data = await res.json();
        alert("❌ Error: " + data.detail);
      }
    } catch (err) {
      alert("❌ Backend Offline. Please start main.py");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans tracking-tight">
      <div className="max-w-md w-full bg-white p-10 rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.05)] border border-teal-50 text-center">
        
        <h2 className="text-4xl font-extrabold text-slate-800 mb-2">
          Create <span className="text-teal-600">Account</span>
        </h2>
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-8">
          Join the Veterinary Clinical Network
        </p>

        <form onSubmit={handleRegister} className="space-y-4 text-left">
          
          {/* 1. Full Name */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Full Name</label>
            <input 
              type="text" 
              name="fullName"
              className="w-full px-6 py-3.5 rounded-2xl bg-slate-50 border border-transparent ring-1 ring-slate-200 focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none transition-all font-bold text-slate-700 placeholder-slate-300"
              
              onChange={handleChange}
              required
            />
          </div>

          {/* 2. Professional Role Dropdown */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Professional Role</label>
            <select 
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-6 py-3.5 rounded-2xl bg-slate-50 border border-transparent ring-1 ring-slate-200 focus:ring-2 focus:ring-teal-500 outline-none transition-all font-bold text-slate-700"
            >
              <option value="Doctor">Veterinary Doctor</option>
              <option value="Staff">Clinic Staff</option>
            </select>
          </div>

          {/* 3. Email ID Field */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Official Email Address</label>
            <input 
              type="email" 
              name="email"
              className="w-full px-6 py-3.5 rounded-2xl bg-slate-50 border border-transparent ring-1 ring-slate-200 focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none transition-all font-bold text-slate-700 placeholder-slate-300"
              placeholder="clinic.id@hospital.com"
              onChange={handleChange}
              required
            />
          </div>

          {/* 4. Dynamic ID Field (Based on Role) */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">
              {formData.role === 'Doctor' ? 'Physician License ID' : 'Staff Personnel ID'}
            </label>
            <input 
              type="text" 
              name="vetId"
              className="w-full px-6 py-3.5 rounded-2xl bg-slate-50 border border-transparent ring-1 ring-slate-200 focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none transition-all font-bold text-slate-700 placeholder-slate-300"
              placeholder={formData.role === 'Doctor' ? "DOC-2026-X" : "STAFF-2026-X"}
              onChange={handleChange}
              required
            />
          </div>

          {/* 5. Password */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Secure Access Password</label>
            <input 
              type="password" 
              name="password"
              className="w-full px-6 py-3.5 rounded-2xl bg-slate-50 border border-transparent ring-1 ring-slate-200 focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none transition-all font-bold text-slate-700 placeholder-slate-300"
              placeholder="••••••••"
              onChange={handleChange}
              required
            />
          </div>

          {/* Register Button */}
          <button 
            type="submit" 
            className="w-full bg-slate-900 hover:bg-teal-700 text-white font-black py-4 rounded-2xl shadow-xl transition-all hover:-translate-y-1 active:scale-95 uppercase text-xs tracking-[0.2em]"
          >
            Finalize Registration
          </button>
        </form>

        <div className="mt-8">
            <button 
                onClick={onBackToLogin}
                className="text-teal-600 hover:text-teal-800 font-black text-sm decoration-2 underline underline-offset-8 transition-all"
            >
                Return to Login
            </button>
        </div>
      </div>
    </div>
  );
};

export default Register;