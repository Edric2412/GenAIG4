'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useConversation } from './LayoutWrapper';

const Sidebar = ({ subtext = "The Ethereal Archive", links = [] }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { conversations, activeConversationId, setActiveConversationId } = useConversation();

  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.removeItem('atlas_role');
    localStorage.removeItem('atlas_token');
    router.push('/login');
  };

  const startNewChat = () => {
    setActiveConversationId(null);
    router.push('/chat');
  };

  const selectConversation = (id) => {
    setActiveConversationId(id);
    if (pathname !== '/chat') {
        router.push('/chat');
    }
  };

  return (
    <nav className="flex h-full flex-col border-r border-white/5 bg-[#0c1516]/80 backdrop-blur-[25px] w-full rounded-r-2xl shadow-[inset_-1px_0_0_0_rgba(218,228,229,0.05)] z-40 transition-all">
      {/* Header */}
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-full overflow-hidden glass-bezel bg-surface-container-lowest">
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCsrC2l9JcxRoaPl_FIg00yb3VmMJCVdgualEX0Whif1gp7brGWXvUnl0mUF4ALL-B3y5Jsn-iePPMKyMCdT61ZSCnmZUtBHB9WEd_ob4-qPyMzq27H0_SS6bczKkkAslYuFLJUtAELP3eei2tt4S8ZlHmgd5RLO2W6_065VS_Kv5Xy0mnu2sBEssCjCyg5IxeBOOBW-QTIsBG4B1k1LhCn2jNfsbI6ToF5k82NMytIGsl7BLcNRcQTE4ox8xCfn4wcOIM3Kezoo2s" 
              alt="Atlas AI" 
              className="w-full h-full object-cover" 
            />
          </div>
          <div>
            <h1 className="font-headline font-serif text-xl text-cyan-50 font-bold tracking-tight">Atlas Tutor</h1>
            <p className="font-body text-xs text-on-surface-variant opacity-80">{subtext}</p>
          </div>
        </div>
        <button onClick={startNewChat} className="w-full py-3 px-4 rounded-xl font-label text-sm font-medium flex items-center justify-center gap-2 bg-gradient-to-br from-primary to-primary-container text-on-primary hover:opacity-90 transition-opacity">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
          New Inquiry
        </button>
      </div>

      {/* Navigation Links / History */}
      <div className="flex-1 overflow-y-auto px-2 space-y-1 mt-4 ethereal-scrollbar">
        {links.map((link, index) => {
          if (link.isHistory) {
              return (
                <div key="history-section" className="mt-4">
                    <p className="px-4 mb-2 text-[10px] font-label font-bold uppercase tracking-[0.2em] text-on-surface-variant opacity-50">Recent Explorations</p>
                    {conversations.map((conv) => (
                        <button
                            key={conv.id}
                            onClick={() => selectConversation(conv.id)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all mb-1 ${activeConversationId === conv.id ? 'bg-cyan-400/20 text-cyan-100 glass-bezel' : 'text-cyan-100/50 hover:bg-white/5 hover:text-cyan-50'}`}
                        >
                            <span className="material-symbols-outlined text-sm">history</span>
                            <span className="font-label text-xs tracking-wide truncate text-left">{conv.title}</span>
                        </button>
                    ))}
                    {conversations.length === 0 && (
                        <p className="px-4 py-2 text-[10px] italic text-on-surface-variant opacity-30">No archives yet.</p>
                    )}
                </div>
              );
          }
          
          const isActive = pathname === link.href;
          return (
            <Link 
              key={index}
              href={link.href} 
              className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-xl transition-all ${isActive ? 'bg-cyan-400/20 text-cyan-100 glass-bezel' : 'text-cyan-100/50 hover:bg-white/5 hover:text-cyan-50'}`}
            >
              <span className={`material-symbols-outlined ${isActive ? 'text-primary' : ''}`} style={link.fill || isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>{link.icon}</span>
              <span className="font-label text-sm tracking-wide truncate">{link.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Footer Actions */}
      <div className="p-4 mt-auto space-y-1">
        <button onClick={() => alert('Help Center is coming soon!')} className="w-full flex items-center gap-3 text-cyan-100/50 px-4 py-3 mx-2 hover:bg-white/5 hover:text-cyan-50 rounded-xl transition-all">
          <span className="material-symbols-outlined">help_outline</span>
          <span className="font-label text-sm tracking-wide">Help Center</span>
        </button>
        <button onClick={handleLogout} className="w-full flex items-center gap-3 text-cyan-100/50 px-4 py-3 mx-2 hover:bg-white/5 hover:text-cyan-50 rounded-xl transition-all">
          <span className="material-symbols-outlined">logout</span>
          <span className="font-label text-sm tracking-wide">Log Out</span>
        </button>
      </div>
    </nav>
  );
};

export default Sidebar;
