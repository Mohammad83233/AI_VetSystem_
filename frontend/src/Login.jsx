import React, { useState } from 'react';

const Login = ({ selectedRole, onGoToSignup, onLoginSuccess, onBack }) => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // 1. Determine which role we are showing
  const isStaff = selectedRole === 'Staff';

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch("http://localhost:8000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vetId: userId,
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Pass name and role to App.jsx to unlock the correct dashboard
        onLoginSuccess(data.user_name, data.role);
      } else {
        alert("❌ Access Denied: " + data.detail);
      }
    } catch (error) {
      alert("❌ Connection Error: Is the Backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 font-sans tracking-tight transition-all duration-500 ${!isStaff ? 'bg-slate-950' : 'bg-slate-50'}`}>
      
      {/* Dynamic Card Container: Dark for Doctor, Light for Staff */}
      <div className={`max-w-md w-full p-10 rounded-[2.5rem] shadow-2xl border relative overflow-hidden transition-all duration-500 ${!isStaff ? 'bg-slate-900 border-slate-800' : 'bg-white border-teal-50'}`}>
        
        {/* Back Button */}
        <button 
          onClick={onBack}
          className={`absolute top-10 left-10 transition-colors group flex items-center gap-2 ${!isStaff ? 'text-slate-500 hover:text-teal-400' : 'text-slate-400 hover:text-teal-600'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="text-[10px] font-black uppercase tracking-widest text-inherit">Portal</span>
        </button>

        {/* Dynamic Icon Section */}
        <div className="text-center mt-6 mb-10">
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-3xl rotate-3 mb-6 shadow-xl transition-all duration-500 ${!isStaff ? 'bg-slate-800 text-teal-400 shadow-black/50' : 'bg-teal-600 text-white shadow-teal-100'}`}>
            {isStaff ? (
                // Staff Shield Icon
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
            ) : (
                // Doctor Medical Bag Icon
                <svg xmlns="http://www.w3.org/2000/svg" className="h-11 w-11" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
            )}
          </div>
          
          <h1 className={`text-4xl font-extrabold tracking-tighter transition-colors duration-500 ${!isStaff ? 'text-white' : 'text-slate-800'}`}>
            Vet<span className="text-teal-500">AI</span>
          </h1>
          
          <p className={`mt-2 text-[10px] font-black uppercase tracking-[0.3em] transition-colors duration-500 ${!isStaff ? 'text-slate-500' : 'text-slate-400'}`}>
            {isStaff ? 'Reception Staff Portal' : 'Clinical Physician Access'}
          </p>
        </div>

        {/* Form Section */}
        <form onSubmit={handleLogin} className="space-y-6 text-left">
          <div className="space-y-1">
            {/* Dynamic Label */}
            <label className={`text-[10px] font-black uppercase ml-2 tracking-widest ${!isStaff ? 'text-slate-500' : 'text-slate-400'}`}>
              {isStaff ? 'Staff Personnel ID' : 'Physician License ID'}
            </label>
            
            {/* Dynamic Placeholder */}
            <input 
              type="text" 
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className={`w-full px-6 py-4 rounded-2xl border border-transparent ring-1 outline-none transition-all font-bold ${
                !isStaff 
                ? 'bg-slate-800 ring-slate-700 text-white focus:ring-teal-500' 
                : 'bg-slate-50 ring-slate-200 text-slate-700 focus:ring-teal-500 focus:bg-white'
              }`}
              placeholder={isStaff ? "STAFF-2025-X" : "DOC-2025-X"}
              required
            />
          </div>

          <div className="space-y-1">
            <label className={`text-[10px] font-black uppercase ml-2 tracking-widest ${!isStaff ? 'text-slate-500' : 'text-slate-400'}`}>
              Security Access Key
            </label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full px-6 py-4 rounded-2xl border border-transparent ring-1 outline-none transition-all font-bold ${
                !isStaff 
                ? 'bg-slate-800 ring-slate-700 text-white focus:ring-teal-500' 
                : 'bg-slate-50 ring-slate-200 text-slate-700 focus:ring-teal-500 focus:bg-white'
              }`}
              placeholder="••••••••"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full font-black py-4 rounded-2xl shadow-xl transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-50 uppercase text-xs tracking-[0.2em] text-white ${
                !isStaff ? 'bg-teal-600 hover:bg-teal-500' : 'bg-slate-900 hover:bg-teal-600'
            }`}
          >
            {loading ? "Establishing..." : "Establish Connection"}
          </button>
        </form>

        {/* Footer/Signup Link */}
        <div className="mt-10 text-center border-t border-slate-100/10 pt-8">
            <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-tighter">New to the Clinical Network?</p>
            <button 
                type="button"
                onClick={onGoToSignup}
                className="text-teal-500 hover:text-teal-400 font-black text-sm decoration-2 underline underline-offset-8 transition-all"
            >
                Register Professional Account
            </button>
        </div>
      </div>
    </div>
  );
};

export default Login;