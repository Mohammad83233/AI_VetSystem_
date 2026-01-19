import React, { useState, useEffect } from 'react';

const StaffDashboard = ({ onLogout }) => {
  const today = new Date().toISOString().split('T')[0];

  // 1. STATE MANAGEMENT
  const initialState = {
    petName: '', ownerName: '', species: 'dog', breed: '', 
    age: '', gender: 'Male', weight: '', temp: '', 
    duration: '', heartRate: '', consultDate: today
  };

  const [formData, setFormData] = useState(initialState);
  const [queue, setQueue] = useState({ waiting: [], completed: [] });
  const [issuedToken, setIssuedToken] = useState(null);
  const [activeTab, setActiveTab] = useState('waiting');
  const [loading, setLoading] = useState(false);

  // 2. FETCH QUEUE DATA (Simplified: Trusting Backend Daily Reset Logic)
  const fetchQueue = async () => {
    try {
      const res = await fetch("http://localhost:8000/get-queue");
      const data = await res.json();
      
      // The backend now returns only today's patients separated by status
      setQueue(data);
    } catch (err) {
      console.error("Queue sync failed");
    }
  };

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 10000); // Live sync every 10 seconds
    return () => clearInterval(interval);
  }, []);

  // 3. SUBMIT FORM & REFRESH
  const handleIssueToken = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      ...formData,
      age: parseInt(formData.age),
      duration: parseInt(formData.duration),
      heartRate: parseInt(formData.heartRate),
      weight: parseFloat(formData.weight),
      temp: parseFloat(formData.temp)
    };

    try {
      const response = await fetch("http://localhost:8000/issue-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      
      if (response.ok) {
        setIssuedToken(data.tokenId);
        setFormData(initialState);
        fetchQueue();
        alert(`✅ Token ${data.tokenId} Generated Successfully!`);
      } else {
        alert("⚠️ Registration Error: " + JSON.stringify(data.detail));
      }
    } catch (err) {
      alert("❌ Clinical Server offline.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans tracking-tight text-left">
      
      {/* --- TOP NAVIGATION --- */}
      <nav className="bg-white border-b border-slate-100 p-5 px-10 flex justify-between items-center shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-3">
            <div className="bg-teal-600 p-2 rounded-xl text-white shadow-lg shadow-teal-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
            </div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tighter">Vet<span className="text-teal-600">AI</span> STAFF</h1>
        </div>
        
        <button onClick={onLogout} className="bg-red-50 text-red-500 px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-sm active:scale-95">
          Logout
        </button>
      </nav>

      <div className="p-8 flex flex-col lg:flex-row gap-10 max-w-[1700px] mx-auto w-full items-start">
        
        {/* --- LEFT COLUMN: REGISTRATION FORM --- */}
        <div className="flex-1 bg-white p-12 rounded-[3.5rem] shadow-2xl shadow-slate-200 border border-teal-50">
          <h2 className="text-3xl font-black text-slate-800 mb-10 uppercase tracking-widest flex items-center gap-3">
            <span className="w-4 h-4 bg-teal-500 rounded-full animate-pulse"></span>
            Register New Patient
          </h2>
          
          <form onSubmit={handleIssueToken} className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Pet Name</label>
                <input className="w-full p-4 bg-slate-50 rounded-2xl border-none ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-teal-500 font-bold text-slate-700 shadow-inner" 
                  placeholder="e.g. Tommy" value={formData.petName} onChange={e => setFormData({...formData, petName: e.target.value})} required />
            </div>
            
            <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Guardian Name</label>
                <input className="w-full p-4 bg-slate-50 rounded-2xl border-none ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-teal-500 font-bold text-slate-700 shadow-inner" 
                  placeholder="Owner's Full Name" value={formData.ownerName} onChange={e => setFormData({...formData, ownerName: e.target.value})} required />
            </div>

            <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Species</label>
                <select className="w-full p-4 bg-slate-50 rounded-2xl border-none ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-teal-500 font-bold text-slate-700"
                  value={formData.species} onChange={e => setFormData({...formData, species: e.target.value})}>
                  <option value="dog">Dog</option><option value="cat">Cat</option>
                  <option value="cow">Cow</option><option value="horse">Horse</option>
                  <option value="sheep">Sheep</option><option value="goat">Goat</option>
                  <option value="pig">Pig</option><option value="rabbit">Rabbit</option>
                </select>
            </div>

            <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Animal Breed</label>
                <input className="w-full p-4 bg-slate-50 rounded-2xl border-none ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-teal-500 font-bold text-slate-700" 
                  placeholder="e.g. Labrador" value={formData.breed} onChange={e => setFormData({...formData, breed: e.target.value})} required />
            </div>

            <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Gender</label>
                <select className="w-full p-4 bg-slate-50 rounded-2xl border-none ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-teal-500 font-bold text-slate-700"
                  value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                  <option value="Male">Male</option><option value="Female">Female</option>
                </select>
            </div>

            <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Age (Years)</label>
                <input className="w-full p-4 bg-slate-50 rounded-2xl border-none ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-teal-500 font-bold" 
                  type="number" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} required />
            </div>

            <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Heart Rate (BPM)</label>
                <input className="w-full p-4 bg-slate-50 rounded-2xl border-none ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-teal-500 font-bold" 
                  type="number" placeholder="100" value={formData.heartRate} onChange={e => setFormData({...formData, heartRate: e.target.value})} required />
            </div>

            <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Weight (kg)</label>
                <input className="w-full p-4 bg-slate-50 rounded-2xl border-none ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-teal-500 font-bold" 
                  type="number" step="0.1" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} required />
            </div>

            <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Current Temp (°C)</label>
                <input className="w-full p-4 bg-slate-50 rounded-2xl border-none ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-teal-500 font-bold" 
                  type="number" step="0.1" placeholder="38.5" value={formData.temp} onChange={e => setFormData({...formData, temp: e.target.value})} required />
            </div>

            <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Duration (Days)</label>
                <input className="w-full p-4 bg-slate-50 rounded-2xl border-none ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-teal-500 font-bold" 
                  type="number" placeholder="How long sick?" value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} required />
            </div>

            <div className="col-span-full space-y-1">
                <label className="text-[10px] font-black text-teal-600 uppercase ml-2 tracking-widest">Consultation Date</label>
                <input className="w-full p-4 bg-teal-50 rounded-2xl border-none ring-1 ring-teal-200 font-black text-teal-700 outline-none focus:ring-2 focus:ring-teal-500" 
                  type="date" value={formData.consultDate} onChange={e => setFormData({...formData, consultDate: e.target.value})} required />
            </div>

            <button type="submit" disabled={loading}
              className="col-span-full bg-slate-900 text-white font-black py-6 rounded-[2.5rem] shadow-2xl hover:bg-teal-700 transition-all uppercase text-xs tracking-[0.3em] active:scale-95 disabled:opacity-50">
              {loading ? "Registering..." : "Generate Clinical Token"}
            </button>
          </form>

          {issuedToken && (
            <div className="mt-10 p-10 bg-teal-600 rounded-[3rem] text-white text-center shadow-2xl shadow-teal-100 border-4 border-white animate-in zoom-in duration-500">
               <p className="text-[10px] font-black uppercase tracking-[0.5em] mb-2 opacity-70">Patient Ticket Assigned</p>
               <h1 className="text-9xl font-black tracking-tighter leading-none">{issuedToken}</h1>
               <button onClick={() => setIssuedToken(null)} className="mt-4 text-xs underline opacity-50 hover:opacity-100">Dismiss</button>
            </div>
          )}
        </div>

        {/* --- RIGHT COLUMN: LIVE PATIENT TRACKER (Daily Stats) --- */}
        <div className="w-[450px] bg-[#0f172a] rounded-[3.5rem] p-10 text-white shadow-2xl flex flex-col border border-white/5 h-[950px] sticky top-28">
            <h3 className="text-teal-400 font-black text-[10px] uppercase tracking-[0.4em] mb-10 text-left underline decoration-teal-900 underline-offset-8">
                Today's Patient Tracker
            </h3>

            {/* Tracker Tabs */}
            <div className="bg-[#1e293b] p-2 rounded-3xl flex gap-2 mb-10 shadow-inner">
                <button 
                onClick={() => setActiveTab('waiting')}
                className={`flex-1 py-4 text-[10px] font-black rounded-2xl transition-all duration-300 ${activeTab === 'waiting' ? 'bg-teal-600 text-white shadow-lg shadow-teal-900/50 scale-105' : 'text-slate-500 hover:text-slate-300'}`}
                >
                WAITING ({queue.waiting.length})
                </button>
                <button 
                onClick={() => setActiveTab('completed')}
                className={`flex-1 py-4 text-[10px] font-black rounded-2xl transition-all duration-300 ${activeTab === 'completed' ? 'bg-teal-600 text-white shadow-lg shadow-teal-900/50 scale-105' : 'text-slate-500 hover:text-slate-300'}`}
                >
                COMPLETED ({queue.completed.length})
                </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                {(activeTab === 'waiting' ? queue.waiting : queue.completed).length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-30">
                    <p className="text-slate-500 text-sm italic font-medium">No activity for today yet</p>
                </div>
                ) : (
                <div className="space-y-4">
                    {(activeTab === 'waiting' ? queue.waiting : queue.completed).map((p) => (
                    <div key={p.tokenId} className="p-6 rounded-[2rem] bg-white/5 border border-white/5 hover:border-teal-500/30 hover:bg-white/10 transition-all duration-300 text-left">
                        <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">ID #{p.tokenId}</span>
                        {activeTab === 'waiting' && <div className="h-2 w-2 bg-teal-400 rounded-full animate-pulse shadow-[0_0_8px_#2dd4bf]"></div>}
                        </div>
                        <p className="font-black text-xl text-white tracking-tight capitalize">{p.petName}</p>
                        <div className="flex gap-3 mt-4">
                        <span className="text-[9px] font-black text-teal-400 bg-teal-400/10 px-3 py-1 rounded-full uppercase tracking-tighter">{p.species}</span>
                        <span className="text-[9px] font-black text-slate-400 bg-white/5 px-3 py-1 rounded-full uppercase tracking-tighter italic">{p.breed}</span>
                        </div>
                    </div>
                    ))}
                </div>
                )}
            </div>

            <div className="mt-10 pt-8 border-t border-white/5 flex flex-col gap-6">
                <div className="flex justify-center items-center text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    TOTAL VISITS TODAY: <span className="text-white ml-2">{queue.waiting.length + queue.completed.length}</span>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default StaffDashboard;