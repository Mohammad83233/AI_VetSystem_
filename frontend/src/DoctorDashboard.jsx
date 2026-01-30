import React, { useState, useEffect } from 'react';

const DoctorDashboard = ({ user, onLogout }) => {
  const [lists, setLists] = useState({ waiting: [], completed: [] });
  const [activeTab, setActiveTab] = useState('waiting');
  const [selectedPet, setSelectedPet] = useState(null);
  const [symptoms, setSymptoms] = useState('');
  const [results, setResults] = useState(null);
  const [answeredList, setAnsweredList] = useState([]);
  const [diagnosing, setDiagnosing] = useState(false);

  // 1. FETCH QUEUE (Syncs Waiting and Archived lists)
  const fetchQueue = async () => {
    try {
      const res = await fetch("http://localhost:8000/get-queue");
      const data = await res.json();
      setLists(data);
    } catch (err) {
      console.error("Clinical queue sync failed");
    } 
  };

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 10000); // Auto-sync every 10 seconds
    return () => clearInterval(interval);
  }, []);

  // 2. RUN AI DIAGNOSIS
  const runDiagnosis = async (currentText = symptoms, currentAnswered = answeredList) => {
    if (!selectedPet) return;
    setDiagnosing(true);
    try {
      const res = await fetch("http://localhost:8000/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tokenId: selectedPet.tokenId,
          symptomsText: currentText,
          answeredSymptoms: currentAnswered
        })
      });
      const data = await res.json();
      setResults(data);
    } catch (err) {
      alert("AI Brain unreachable.");
    } finally {
      setDiagnosing(false);
    }
  };

  // 3. REFINEMENT FOLLOW-UP
  const handleFollowUp = (isYes) => {
    const suggestedSymptom = results.refinement.symptom;
    const newAnswered = [...answeredList, suggestedSymptom];
    setAnsweredList(newAnswered);

    let updatedText = symptoms;
    if (isYes) {
      updatedText = symptoms.length > 0 ? `${symptoms}, ${suggestedSymptom}` : suggestedSymptom;
      setSymptoms(updatedText);
    }
    runDiagnosis(updatedText, newAnswered);
  };

  // 4. FINALIZE & ARCHIVE (Moves pet from Waiting -> Archived instantly)
  const finalize = async () => {
    if (!selectedPet) return;
    try {
      const res = await fetch(`http://localhost:8000/finalize/${selectedPet.tokenId}`, { 
        method: "POST" 
      });
      
      if (res.ok) {
        // Step A: Switch tab to Archived immediately
        setActiveTab('completed');
        // Step B: Clear workspace
        setSelectedPet(null);
        setResults(null);
        setAnsweredList([]);
        setSymptoms('');
        // Step C: Refresh the sidebar list to reflect the move
        fetchQueue();
      } else {
        alert("Could not finalize record. Check server connection.");
      }
    } catch (err) {
      alert("Network error. Finalization failed.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans text-left tracking-tight">
      
      {/* --- SIDEBAR: CLINICAL QUEUE --- */}
      <div className="w-80 bg-slate-900 text-white flex flex-col border-r border-slate-800">
        <div className="p-6">
          <h1 className="text-xl font-black text-teal-400 mb-6 uppercase italic tracking-[0.2em]">VetAI Physician</h1>
          
          <div className="flex bg-slate-800 p-1 rounded-xl mb-6 shadow-inner">
            <button 
              onClick={() => setActiveTab('waiting')} 
              className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${activeTab === 'waiting' ? 'bg-teal-600 text-white shadow-lg' : 'text-slate-500'}`}
            >
              WAITING ({lists.waiting.length})
            </button>
            <button 
              onClick={() => setActiveTab('completed')} 
              className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${activeTab === 'completed' ? 'bg-teal-600 text-white shadow-lg' : 'text-slate-500'}`}
            >
              ARCHIVED ({lists.completed.length})
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-3 custom-scrollbar">
          {(activeTab === 'waiting' ? lists.waiting : lists.completed).map(p => (
            <div 
              key={p.tokenId} 
              onClick={() => { 
                setSelectedPet(p); 
                // Only clear results if we are picking a new person to examine
                if (p.status === "Waiting") {
                  setResults(null); 
                  setAnsweredList([]); 
                  setSymptoms(''); 
                }
              }} 
              className={`p-5 rounded-[1.5rem] cursor-pointer transition-all duration-300 ${selectedPet?.tokenId === p.tokenId ? 'bg-teal-600 scale-105 shadow-xl' : 'bg-slate-800 hover:bg-slate-700 opacity-80'}`}
            >
              <div className="flex justify-between items-center mb-1">
                <p className="font-black text-lg leading-tight">{p.petName}</p>
                <span className="text-[9px] font-bold opacity-40">#{p.tokenId}</span>
              </div>
              <p className="text-[10px] uppercase font-bold text-white/40 tracking-widest">{p.species} • {p.breed}</p>
            </div>
          ))}
        </div>

        <div className="p-6 border-t border-white/5">
          <button onClick={onLogout} className="w-full py-3 bg-red-500/10 text-red-500 rounded-xl font-bold uppercase text-[10px] hover:bg-red-500 hover:text-white transition-all active:scale-95">
            Logout Physician
          </button>
        </div>
      </div>

      {/* --- MAIN EXAMINATION AREA --- */}
      <div className="flex-1 p-10 overflow-y-auto">
        {selectedPet ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 max-w-7xl mx-auto items-start">
            
            <div className="bg-white p-10 rounded-[3.5rem] shadow-xl border border-teal-50 h-fit">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <p className="text-teal-600 font-black text-[10px] uppercase tracking-[0.3em] mb-1">Active Examination</p>
                  <h2 className="text-4xl font-black text-slate-800 tracking-tighter capitalize">{selectedPet.petName}</h2>
                </div>
                <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${selectedPet.status === 'Waiting' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                    {selectedPet.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-6 p-8 bg-slate-50 rounded-[2.5rem] mb-10 border border-slate-100">
                <div className="flex flex-col"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Species</label><p className="text-lg font-black text-slate-700 capitalize">{selectedPet.species}</p></div>
                <div className="flex flex-col"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Breed</label><p className="text-lg font-black text-slate-700 capitalize">{selectedPet.breed}</p></div>
                <div className="flex flex-col"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Age</label><p className="text-lg font-black text-slate-700">{selectedPet.age} Years</p></div>
                <div className="flex flex-col"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Gender</label><p className="text-lg font-black text-slate-700 capitalize">{selectedPet.gender}</p></div>
                <div className="flex flex-col"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Weight</label><p className="text-lg font-black text-slate-700">{selectedPet.weight} kg</p></div>
                <div className="flex flex-col"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Body Temp</label><p className="text-lg font-black text-teal-600">{selectedPet.temp}°C</p></div>
                <div className="flex flex-col"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Heart Rate</label><p className="text-lg font-black text-pink-600">{selectedPet.heartRate} BPM</p></div>
                <div className="flex flex-col"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Duration</label><p className="text-lg font-black text-indigo-600">{selectedPet.duration} Days</p></div>
              </div>

              {selectedPet.status === "Waiting" ? (
                <div className="space-y-6">
                   <div className="relative">
                      <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest mb-3 block">Physician Observations</label>
                      <textarea 
                        className="w-full p-8 bg-slate-50 rounded-[2rem] h-48 outline-none border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-teal-500 font-medium text-slate-700 transition-all placeholder:text-slate-300" 
                        placeholder="Type symptoms found during physical exam..." 
                        value={symptoms} 
                        onChange={e => setSymptoms(e.target.value)}
                      />
                   </div>
                   <button 
                    onClick={() => runDiagnosis()} 
                    disabled={diagnosing || !symptoms}
                    className="w-full bg-slate-900 text-white font-black py-6 rounded-[2rem] shadow-2xl hover:bg-teal-600 transition-all uppercase text-xs tracking-[0.3em] active:scale-95 disabled:opacity-30">
                    {diagnosing ? "Consulting AI..." : "Begin AI Diagnosis"}
                   </button>
                </div>
              ) : (
                <div className="p-10 bg-green-50 rounded-[2.5rem] text-center border-2 border-dashed border-green-200">
                    <p className="text-green-700 font-black uppercase text-xs tracking-widest">Case Completed</p>
                    <p className="text-[10px] text-green-600/60 mt-2">This record is archived.</p>
                </div>
              )}
            </div>

            <div className="bg-slate-900 rounded-[3.5rem] p-10 text-white shadow-2xl min-h-[700px] flex flex-col">
               {results ? (
                 <div className="text-left animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col h-full">
                    <h4 className="text-teal-400 font-black text-[10px] uppercase mb-8 border-b border-white/10 pb-4 tracking-[0.3em]">Probable Diagnoses</h4>
                    
                    {results.predictions.map((p, i) => (
                      <div key={i} className={`flex justify-between items-center p-6 mb-4 transition-all ${i === 0 ? 'bg-white/10 rounded-2xl border border-white/10 scale-105 shadow-xl' : 'opacity-20'}`}>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-teal-500 uppercase">Option {i+1}</span>
                            <span className="font-black text-xl uppercase tracking-tight">{p.disease}</span>
                        </div>
                        <span className="text-teal-400 font-black text-3xl">{p.confidence}%</span>
                      </div>
                    ))}

                    {!results.refinement.isComplete && selectedPet.status === "Waiting" ? (
                      <div className="mt-12 p-8 bg-teal-500/5 rounded-[2.5rem] border border-teal-500/20 shadow-inner">
                        <div className="flex justify-between items-center mb-6">
                            <p className="text-teal-400 text-[10px] font-black uppercase tracking-[0.2em]">Refinement</p>
                            <span className="text-[10px] font-bold text-white/40">Evidence: {results.refinement.currentSymptomCount} / 4</span>
                        </div>
                        <p className="text-2xl font-medium italic mb-10 leading-snug text-white/90">"{results.refinement.question}"</p>
                        <div className="space-y-4">
                          <div className="flex gap-4">
                            <button onClick={() => handleFollowUp(true)} className="flex-1 bg-teal-600 hover:bg-teal-500 text-white font-black py-5 rounded-2xl transition-all shadow-lg uppercase text-xs">Yes</button>
                            <button onClick={() => handleFollowUp(false)} className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-5 rounded-2xl transition-all uppercase text-xs">No</button>
                          </div>
                          <button onClick={finalize} className="w-full mt-2 py-4 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-teal-400 hover:border-teal-400 transition-all">
                            Finalize results with current data
                          </button>
                        </div>
                      </div>
                    ) : (
                        <div className="mt-auto pt-10">
                           {selectedPet.status === "Waiting" && (
                             <>
                               <div className="mb-6 p-6 bg-green-500/10 border border-green-500/20 rounded-2xl text-center">
                                  <p className="text-green-400 font-bold text-[10px] uppercase tracking-widest">Confidence Threshold Reached</p>
                               </div>
                               <button onClick={finalize} className="w-full bg-green-600 hover:bg-green-500 text-white font-black py-6 rounded-[2rem] shadow-xl transition-all uppercase text-xs tracking-widest flex items-center justify-center gap-3">
                                  Archive Final Diagnosis
                               </button>
                             </>
                           )}
                        </div>
                    )}
                 </div>
               ) : (
                 <div className="flex-1 flex flex-col items-center justify-center opacity-10">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                    <p className="font-bold uppercase tracking-[0.5em] text-xs">Awaiting Examination</p>
                 </div>
               )}
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-300 py-40">
             <div className="bg-white p-20 rounded-[4rem] shadow-sm border border-slate-200 flex flex-col items-center">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                </div>
                <h3 className="font-black text-2xl uppercase tracking-widest text-slate-400">Clinical Queue</h3>
                <p className="mt-2 font-bold text-slate-400 uppercase text-[10px] tracking-widest italic opacity-60">Select a patient from the list to begin</p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard;