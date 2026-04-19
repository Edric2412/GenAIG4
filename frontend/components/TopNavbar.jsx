import React from 'react';

const TopNavbar = ({ showSearch = false, profileImg = "https://lh3.googleusercontent.com/aida-public/AB6AXuCMVETEIUhjtt2hPAUIQmcB0n_iYhU7TjHJy3HiF91jk1V52d9vbk6Opa_joRhg7f1IhmGmWTbn3b9IBptLAoxYKso-DnoY2AIeisHjmaVf9mcctw0H0uGYJiNxdmGsaAWVAtT4QYWDugw8kkAVdaJoy3S4l_iH0bgn_Oxl30CtMGh0OGf2gvx4a2oznGxuWrNbHCJjgEojjPcgJGbfep7PXMC2tqxSE_k9ivpMKx8gEGOJZ-1BvdhVDSIOPdHdh5bVbH3A8_Zt4Z0", onSubjectChange }) => {
  const subjects = [
    { id: 'all', name: 'All Subjects' },
    { id: 'Theoretical Physics', name: 'Theoretical Physics' },
    { id: 'Classical Literature', name: 'Classical Literature' },
    { id: 'Abstract Mathematics', name: 'Abstract Mathematics' },
    { id: 'Philosophy', name: 'Philosophy' },
  ];

  return (
    <header className="flex justify-between items-center w-full px-6 py-3 z-50 bg-[#0c1516]/60 backdrop-blur-[20px] shadow-[inset_0_1px_0_0_rgba(218,228,229,0.1)] border-b border-white/10 sticky top-0">
      <div className="md:hidden flex items-center gap-2 text-2xl font-serif italic text-cyan-50">
        <span className="font-headline font-bold">Atlas Tutor</span>
      </div>

      <div className="flex items-center gap-4 w-full justify-between">
        <div className="flex items-center gap-4">
          <button className="md:hidden text-on-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined">menu</span>
          </button>
          
          {showSearch && (
            <div className="hidden md:flex items-center bg-surface-container-lowest border border-outline-variant/15 rounded-full px-4 py-1.5 focus-within:border-primary focus-within:shadow-[0_0_8px_rgba(85,215,237,0.1)] transition-all">
              <span className="material-symbols-outlined text-on-surface-variant text-sm mr-2">search</span>
              <input 
                type="text" 
                onClick={() => alert('Quick search coming soon!')}
                className="bg-transparent border-none focus:ring-0 text-sm text-on-surface placeholder:text-on-surface-variant/50 w-64 outline-none" 
                placeholder="Quick search..." 
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="relative hidden sm:block">
            <select 
              onChange={(e) => onSubjectChange?.(e.target.value)}
              className="appearance-none bg-surface-variant/40 backdrop-blur-md px-4 py-2 pr-10 rounded-xl text-sm font-label text-cyan-50 glass-bezel hover:bg-surface-variant/60 transition-all border-none focus:ring-0 cursor-pointer"
            >
              {subjects.map(s => <option key={s.id} value={s.id} className="bg-surface text-on-surface">{s.name}</option>)}
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none">expand_more</span>
          </div>
          
          <button onClick={() => alert('Notifications coming soon!')} className="p-2 text-cyan-100/70 hover:text-cyan-50 hover:bg-white/5 rounded-full transition-all duration-300">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button onClick={() => alert('Settings coming soon!')} className="p-2 text-cyan-100/70 hover:text-cyan-50 hover:bg-white/5 rounded-full transition-all duration-300 hidden sm:block">
            <span className="material-symbols-outlined">settings</span>
          </button>
          <div className="w-8 h-8 rounded-full overflow-hidden glass-bezel ml-2 cursor-pointer border border-outline-variant/20 hover:border-primary transition-colors">
            <img 
              src={profileImg} 
              alt="User Profile" 
              className="w-full h-full object-cover" 
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopNavbar;
