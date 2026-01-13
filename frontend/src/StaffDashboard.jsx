import React, { useState, useEffect } from 'react';

const StaffDashboard = ({ user, onLogout }) => {
  const today = new Date().toISOString().split('T')[0];
  const [formData, setFormData] = useState({ 
    petName: '', ownerName: '', species: 'dog', breed: '', 
    age: '', gender: 'Male', weight: '', temp: '', consultDate: today 
  });
  
  const [issuedToken, setIssuedToken] = useState(null);
  const [lists, setLists] = useState({ waiting: [], completed: [] });
  const [activeTab, setActiveTab] = useState('waiting');

  // 1. Fetch live queue for tracking
  const fetchStatus = async () => {
    try {
      const res = await fetch("http://localhost:8000/get-queue");
      const data = await res.json();
      setLists(data);
    } catch (err) { console.error("Tracking update failed"); }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000); // Auto-refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:8000/issue-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (response.ok) {
        setIssuedToken(data.tokenId);
        alert("✅ Entry Successful");
        fetchStatus(); // Refresh list immediately
      } else alert("⚠️ " + data.detail);
    } catch (err) { alert("Backend Error!"); }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-left">
      {/* Header */}
      <nav className="bg-white border-b border-slate-200 p-4 px-10 flex justify-between items-center shadow-sm">
        <h1 className="text-2xl font-black text-teal-600 italic">VetAI | RECEPTION</h1>
        <div className="flex items-center gap-4">
            <p className="text-xs font-bold text-slate-500 uppercase">Staff ID: {user}</p>
            <button onClick={onLogout} className="bg-red-50 text-red-500 px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-500 hover:text-white transition-all">LOGOUT</button>
        </div>
      </nav>

      <div className="p-8 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: REGISTRATION FORM (60% width) */}
        <div className="lg:col-span-7 bg-white p-10 rounded-[3rem] shadow-xl border border-teal-50">
          <h2 className="text-2xl font-black text-slate-800 mb-8 border-b pb-4 uppercase tracking-widest">Register Patient</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6">
            <input className="p-4 bg-slate-50 rounded-2xl ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-teal-500 font-bold" placeholder="Pet Name" onChange={e => setFormData({...formData, petName: e.target.value})} required />
            <input className="p-4 bg-slate-50 rounded-2xl ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-teal-500 font-bold" placeholder="Owner Name" onChange={e => setFormData({...formData, ownerName: e.target.value})} required />
            <select className="p-4 bg-slate-50 rounded-2xl ring-1 ring-slate-200 font-bold" onChange={e => setFormData({...formData, species: e.target.value})}>
              <option value="dog">Dog</option><option value="cat">Cat</option><option value="cow">Cow</option><option value="horse">Horse</option>
            </select>
            <input className="p-4 bg-slate-50 rounded-2xl ring-1 ring-slate-200 font-bold" placeholder="Breed" onChange={e => setFormData({...formData, breed: e.target.value})} required />
            <select className="p-4 bg-slate-50 rounded-2xl ring-1 ring-slate-200 font-bold" onChange={e => setFormData({...formData, gender: e.target.value})}>
              <option value="Male">Male</option><option value="Female">Female</option>
            </select>
            <input className="p-4 bg-slate-50 rounded-2xl ring-1 ring-slate-200" type="number" placeholder="Age" onChange={e => setFormData({...formData, age: e.target.value})} required />
            <input className="p-4 bg-slate-50 rounded-2xl ring-1 ring-slate-200" type="number" step="0.1" placeholder="Weight (kg)" onChange={e => setFormData({...formData, weight: e.target.value})} required />
            <input className="p-4 bg-slate-50 rounded-2xl ring-1 ring-slate-200" type="number" step="0.1" placeholder="Temp (°C)" onChange={e => setFormData({...formData, temp: e.target.value})} required />
            <input className="p-4 bg-slate-50 rounded-2xl ring-1 ring-teal-500 font-bold text-teal-600 col-span-full" type="date" value={formData.consultDate} onChange={e => setFormData({...formData, consultDate: e.target.value})} required />
            <button type="submit" className="col-span-full bg-slate-900 text-white font-black py-5 rounded-[2rem] shadow-xl hover:bg-teal-600 transition-all uppercase text-xs tracking-widest mt-4">Generate Clinical Token</button>
          </form>

          {issuedToken && (
            <div className="mt-8 p-6 bg-teal-600 rounded-[2.5rem] text-white text-center shadow-lg animate-in zoom-in duration-300">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-80 mb-2">New Patient Token</p>
              <h1 className="text-7xl font-black">{issuedToken}</h1>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: LIVE TRACKING (40% width) */}
        <div className="lg:col-span-5 bg-slate-900 rounded-[3rem] p-8 text-white shadow-2xl flex flex-col">
          <h3 className="text-teal-400 font-black text-xs uppercase tracking-widest mb-6 border-b border-slate-800 pb-4">Live Patient Tracker</h3>
          
          {/* TAB SWITCHER */}
          <div className="flex bg-slate-800 p-1 rounded-2xl mb-6">
            <button onClick={() => setActiveTab('waiting')} className={`flex-1 py-2 text-[10px] font-black rounded-xl transition-all ${activeTab === 'waiting' ? 'bg-teal-600' : 'text-slate-500'}`}>WAITING ({lists.waiting.length})</button>
            <button onClick={() => setActiveTab('completed')} className={`flex-1 py-2 text-[10px] font-black rounded-xl transition-all ${activeTab === 'completed' ? 'bg-teal-600' : 'text-slate-500'}`}>COMPLETED ({lists.completed.length})</button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3">
             {(activeTab === 'waiting' ? lists.waiting : lists.completed).map(pet => (
               <div key={pet.tokenId} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex justify-between items-center">
                  <div>
                    <p className="font-black text-sm">{pet.petName}</p>
                    <p className="text-[9px] font-bold text-slate-500 uppercase">{pet.species} • {pet.breed}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-teal-400 font-black text-lg leading-none">{pet.tokenId}</p>
                    <p className="text-[8px] font-bold text-slate-600 uppercase mt-1">Token ID</p>
                  </div>
               </div>
             ))}
             {(activeTab === 'waiting' ? lists.waiting : lists.completed).length === 0 && (
                 <p className="text-center text-slate-600 text-xs italic py-10">No patients in this category</p>
             )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center">
             <button onClick={fetchStatus} className="text-teal-500 text-[10px] font-black hover:underline uppercase tracking-widest">↻ Refresh Stats</button>
             <span className="text-slate-600 text-[9px] font-bold uppercase">Total Patients Today: {lists.waiting.length + lists.completed.length}</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default StaffDashboard;