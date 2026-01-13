import React from 'react';

const LandingPage = ({ onSelectRole, onGoToSignup }) => {
  return (
    // min-h-screen ensures the background covers the entire window
    <div className="min-h-screen bg-white font-sans text-slate-800 flex flex-col overflow-hidden">
      
      {/* 1. HERO & IMAGE SECTION (Takes up the top half of the screen) */}
      <div className="relative h-[50vh] flex items-center justify-center bg-slate-900">
        <img 
          src="https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?auto=format&fit=crop&q=80&w=2070" 
          alt="Veterinary Examination" 
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/20"></div>

        <div className="relative z-10 text-center px-6">
          <h1 className="text-7xl font-black tracking-tighter mb-4 text-white drop-shadow-lg">
            Vet<span className="text-teal-400">AI</span>
          </h1>
          
          <div className="max-w-2xl mx-auto border-l-4 border-teal-500 pl-6 py-2">
            <p className="text-2xl font-medium text-teal-50 italic leading-snug text-left">
              "The greatness of a nation and its moral progress can be judged by the way its animals are treated."
            </p>
            <p className="text-sm font-black text-teal-400 uppercase tracking-[0.3em] mt-2 text-left">— Mahatma Gandhi</p>
          </div>
        </div>
      </div>

      {/* 2. ENTRY CARDS SECTION (Centered and fitting the bottom half) */}
      <div className="flex-1 flex items-center justify-center relative z-20 px-6 -mt-16">
        <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-10">
          
          {/* Staff Portal Card */}
          <div 
            onClick={() => onSelectRole('Staff')}
            className="group bg-white p-12 rounded-[3.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.12)] hover:shadow-teal-100 border border-slate-100 cursor-pointer transition-all hover:-translate-y-2 flex flex-col items-center text-center"
          >
            <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-6 group-hover:bg-teal-600 group-hover:text-white transition-all duration-500 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-3xl font-black mb-3">Reception</h3>
            <p className="text-slate-500 text-sm leading-relaxed max-w-xs mb-8">
              System access for clinic staff to manage patient queue and tokens.
            </p>
            <span className="text-teal-600 font-black text-[10px] uppercase tracking-[0.3em] flex items-center gap-2">
              Select Staff Login <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </span>
          </div>

          {/* Doctor Portal Card */}
          <div 
            onClick={() => onSelectRole('Doctor')}
            className="group bg-slate-900 p-12 rounded-[3.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.3)] hover:shadow-teal-900/30 cursor-pointer transition-all hover:-translate-y-2 text-white flex flex-col items-center text-center"
          >
            <div className="w-20 h-20 bg-slate-800 rounded-[2rem] flex items-center justify-center mb-6 group-hover:bg-teal-500 transition-all duration-500 border border-slate-700 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-teal-400 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <h3 className="text-3xl font-black mb-3 text-white">Physician</h3>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs mb-8">
              Multi-modal AI diagnostics and clinical decision support for veterinarians.
            </p>
            <span className="text-teal-400 font-black text-[10px] uppercase tracking-[0.3em] flex items-center gap-2">
              Select Doctor Login <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </span>
          </div>

        </div>
      </div>

      {/* 3. CLEAN BOTTOM LINK (Minimalist Registration) */}
      <div className="py-12 text-center">
         <button 
            onClick={onGoToSignup}
            className="text-slate-400 hover:text-teal-600 font-bold text-sm transition-all border-b border-transparent hover:border-teal-600"
          >
            Create New Professional Account
          </button>
      </div>

    </div>
  );
};

export default LandingPage;