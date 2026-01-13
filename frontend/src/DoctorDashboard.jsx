import React, { useState, useEffect } from 'react';

const DoctorDashboard = ({ user, onLogout }) => {
  const [lists, setLists] = useState({ waiting: [], completed: [] });
  const [activeTab, setActiveTab] = useState('waiting'); // 'waiting' or 'completed'
  const [selectedPet, setSelectedPet] = useState(null);
  const [symptomsText, setSymptomsText] = useState('');
  const [results, setResults] = useState(null);
  const [qCount, setQCount] = useState(0);
  const [answeredSymptoms, setAnsweredSymptoms] = useState([]);

  const fetchQueue = async () => {
    const res = await fetch("http://localhost:8000/get-queue");
    const data = await res.json();
    setLists(data);
  };

  useEffect(() => { fetchQueue(); }, []);

  const runDiagnosis = async (currentText = symptomsText, currentAnswered = answeredSymptoms) => {
    const response = await fetch("http://localhost:8000/diagnose", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tokenId: selectedPet.tokenId, symptomsText: currentText, answeredSymptoms: currentAnswered })
    });
    const data = await response.json();
    setResults(data);
  };

  // NEW: Finalize Session Function
  const finalizeSession = async () => {
    const res = await fetch(`http://localhost:8000/complete-session/${selectedPet.tokenId}`, { method: "POST" });
    if (res.ok) {
        alert("✅ Consultation Finished");
        setSelectedPet(null);
        setResults(null);
        fetchQueue(); // Refresh the lists
    }
  };

  const handleFollowUp = (isYes) => {
    const nextSym = results.next_sym_internal;
    let updatedText = symptomsText;
    let updatedAnswered = [...answeredSymptoms, nextSym];
    if (isYes) { updatedText = symptomsText + ", " + nextSym; setSymptomsText(updatedText); }
    setAnsweredSymptoms(updatedAnswered);
    setQCount(qCount + 1);
    runDiagnosis(updatedText, updatedAnswered);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans text-left">
      
      {/* SIDEBAR: TABS FOR WAITING AND COMPLETED */}
      <div className="w-80 bg-slate-900 text-white flex flex-col border-r border-slate-800">
        <div className="p-6">
          <h1 className="text-xl font-black text-teal-400 mb-6 tracking-tighter">VetAI CLINIC</h1>
          
          {/* TAB SWITCHER */}
          <div className="flex bg-slate-800 p-1 rounded-xl mb-6">
            <button 
                onClick={() => setActiveTab('waiting')}
                className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${activeTab === 'waiting' ? 'bg-teal-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
                WAITING ({lists.waiting.length})
            </button>
            <button 
                onClick={() => setActiveTab('completed')}
                className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${activeTab === 'completed' ? 'bg-teal-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
                FINISHED ({lists.completed.length})
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4">
          {(activeTab === 'waiting' ? lists.waiting : lists.completed).map(pet => (
            <div key={pet.tokenId} onClick={() => {setSelectedPet(pet); setResults(null); setQCount(0); setAnsweredSymptoms([]); setSymptomsText('');}}
              className={`p-5 rounded-[1.5rem] mb-3 cursor-pointer transition-all ${selectedPet?.tokenId === pet.tokenId ? 'bg-teal-600 scale-105 shadow-xl' : 'bg-slate-800 hover:bg-slate-700 opacity-80'}`}>
              <p className="font-black text-lg">{pet.petName}</p>
              <p className="text-[10px] uppercase font-bold opacity-50">Token {pet.tokenId} • {pet.species}</p>
            </div>
          ))}
        </div>
        
        <div className="p-6 mt-auto"><button onClick={onLogout} className="w-full py-3 bg-red-500/10 text-red-500 rounded-xl text-xs font-bold hover:bg-red-500 hover:text-white transition-all">LOGOUT</button></div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 p-10 overflow-y-auto">
        {selectedPet ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-teal-50">
              <h2 className="text-3xl font-black text-slate-800 mb-6">Patient: {selectedPet.petName}</h2>
              <div className="grid grid-cols-2 gap-4 mb-8">
                 <div className="p-4 bg-slate-50 rounded-2xl">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Details</p>
                    <p className="font-black text-slate-700">{selectedPet.gender} • {selectedPet.breed}</p>
                 </div>
                 <div className="p-4 bg-teal-50/50 rounded-2xl">
                    <p className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">Temperature</p>
                    <p className="font-black text-teal-600 text-2xl">{selectedPet.temp}°C</p>
                 </div>
              </div>

              {/* Only allow editing symptoms if patient is NOT completed */}
              {selectedPet.status === "Waiting" ? (
                <>
                   <textarea className="w-full p-6 bg-slate-50 rounded-3xl h-44 outline-none border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-teal-500 font-medium" 
                   placeholder="Describe observations..." value={symptomsText} onChange={e => setSymptomsText(e.target.value)}/>
                   <button onClick={() => runDiagnosis()} className="w-full mt-6 bg-slate-900 text-white font-black py-5 rounded-[2rem] shadow-xl hover:bg-teal-600 transition-all uppercase text-xs tracking-widest">Run AI Analysis</button>
                </>
              ) : (
                <div className="p-10 bg-green-50 rounded-3xl text-center border border-green-100">
                    <p className="text-green-600 font-bold uppercase tracking-widest text-xs">Viewing Archived Record</p>
                    <p className="text-slate-400 text-xs mt-2 italic text-center mx-auto max-w-[200px]">This patient has already been diagnosed and consultation is finished.</p>
                </div>
              )}
            </div>

            <div className="bg-slate-900 rounded-[3.5rem] p-10 text-white shadow-2xl relative">
               {results ? (
                 <div>
                    <h4 className="text-teal-400 font-black text-[10px] uppercase mb-8 border-b border-slate-800 pb-4 tracking-widest">AI Clinical Indications</h4>
                    {results.predictions.map((p, i) => (
                      <div key={i} className={`flex justify-between items-center p-6 mb-4 ${i === 0 ? 'bg-white/5 rounded-3xl border border-white/10 shadow-inner' : 'opacity-30'}`}>
                        <span className="font-black text-lg">{p.disease}</span>
                        <span className="text-teal-400 font-black text-2xl">{p.confidence}%</span>
                      </div>
                    ))}

                    {/* Question Logic */}
                    {results.follow_up_question && qCount < 4 ? (
                      <div className="mt-10 p-8 bg-teal-500/10 rounded-[2.5rem] border border-teal-500/20 shadow-2xl">
                        <p className="text-xl font-medium italic mb-10 leading-snug">"{results.follow_up_question}"</p>
                        <div className="flex gap-4">
                          <button onClick={() => handleFollowUp(true)} className="flex-1 bg-teal-600 py-4 rounded-2xl font-black shadow-lg uppercase text-xs">Yes</button>
                          <button onClick={() => handleFollowUp(false)} className="flex-1 bg-slate-800 py-4 rounded-2xl font-bold uppercase text-xs">No</button>
                        </div>
                      </div>
                    ) : (
                        <div className="mt-12 text-center">
                            <button 
                                onClick={finalizeSession}
                                className="w-full bg-green-600 hover:bg-green-500 text-white font-black py-5 rounded-[2rem] shadow-xl shadow-green-900/30 transition-all active:scale-95 uppercase text-xs tracking-widest"
                            >
                                ✓ FINALIZE AND SAVE CASE
                            </button>
                        </div>
                    )}
                 </div>
               ) : (
                 <div className="h-full flex items-center justify-center opacity-20"><p className="font-bold uppercase tracking-[0.3em] text-xs">Awaiting Data</p></div>
               )}
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-300 font-black text-2xl uppercase tracking-[0.2em]">Select a patient</div>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard;