'use client';

import React, { useState, useRef, useEffect } from 'react';
import LayoutWrapper, { useSubject } from '../../components/LayoutWrapper';
import { sendMessageStream } from '../../lib/api';
import ChatMessage from '../../components/ChatMessage';

export default function ChatPage() {
  return (
    <LayoutWrapper>
      <ChatUI />
    </LayoutWrapper>
  );
}

function ChatUI() {
  const { selectedSubject } = useSubject();
  const [messages, setMessages] = useState([
    {
      role: 'tutor',
      text: "Greetings. I am Atlas, your guide through this archive. How can I assist your study today?",
      title: "The Ethereal Archive"
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'student', text: userMessage }]);
    setLoading(true);

    // Initial placeholder for tutor response
    setMessages(prev => [...prev, { role: 'tutor', text: "" }]);

    try {
      await sendMessageStream(userMessage, selectedSubject, (fullText) => {
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].text = fullText;
          return newMessages;
        });
      });
    } catch (err) {
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = { 
          role: 'tutor', 
          text: "I encountered a disturbance in the archive connection. Please try again.",
          isError: true
        };
        return newMessages;
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full relative bg-background overflow-hidden">
      {/* Subject Header - More integrated */}
      <div className="flex-shrink-0 flex items-center justify-between px-8 py-4 border-b border-outline-variant/10 bg-surface-container-low/30 backdrop-blur-md z-20">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
          <span className="text-[10px] font-label font-bold uppercase tracking-[0.2em] text-on-surface-variant">
            Current Focus: <span className="text-primary ml-1">{selectedSubject === 'all' ? 'Universal Archive' : selectedSubject}</span>
          </span>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5 opacity-40 hover:opacity-100 transition-opacity cursor-help">
            <span className="material-symbols-outlined text-sm">auto_awesome</span>
            <span className="text-[10px] font-label font-bold uppercase tracking-widest">Enhanced Mode</span>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 relative overflow-hidden flex flex-col min-h-0">
        <main 
          ref={scrollRef} 
          className="flex-1 overflow-y-auto px-4 md:px-0 py-8 z-10 ethereal-scrollbar scroll-smooth"
        >
          <div className="max-w-4xl mx-auto w-full flex flex-col gap-10 pb-44">
            {messages.map((msg, idx) => (
              <ChatMessage 
                key={idx} 
                message={msg} 
                isLast={idx === messages.length - 1}
                loading={loading}
              />
            ))}
            
            {loading && !messages[messages.length-1].text && (
              <div className="animate-in fade-in duration-500">
                <div className="flex items-center gap-3 mb-4 px-1">
                  <div className="w-6 h-6 rounded-full bg-surface-container border border-outline-variant/20 animate-pulse"></div>
                  <span className="text-[10px] font-label font-bold uppercase tracking-wider text-on-surface-variant/40 italic">
                    Atlas is querying the archive...
                  </span>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Input Overlay */}
      <div className="absolute bottom-0 left-0 w-full p-8 z-50 pointer-events-none">
        <div className="max-w-3xl mx-auto w-full pointer-events-auto">
          <form 
            onSubmit={handleSend} 
            className="group relative bg-surface-container-highest/60 backdrop-blur-[40px] rounded-2xl p-2 border border-outline-variant/20 shadow-2xl transition-all duration-500 hover:border-primary/30 hover:bg-surface-container-highest/80 focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/5"
          >
            <div className="flex items-end gap-2 px-2 py-1">
              <button 
                type="button" 
                className="p-2.5 text-on-surface-variant hover:text-primary transition-colors rounded-xl hover:bg-white/5 flex-shrink-0"
              >
                <span className="material-symbols-outlined text-[20px]">add_circle</span>
              </button>
              
              <textarea 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e);
                  }
                }}
                className="w-full bg-transparent border-none text-on-surface font-body text-sm md:text-base resize-none focus:ring-0 px-2 py-3 max-h-48 placeholder:text-on-surface-variant/30 leading-relaxed" 
                placeholder="Ask Atlas about your materials..." 
                rows={1}
              ></textarea>
              
              <button 
                type="submit"
                disabled={!input.trim() || loading}
                className={`p-2.5 rounded-xl transition-all duration-300 flex items-center justify-center flex-shrink-0
                  ${!input.trim() || loading 
                    ? 'bg-surface-container text-on-surface-variant/20 cursor-not-allowed' 
                    : 'bg-primary text-on-primary shadow-lg shadow-primary/20 hover:scale-105 active:scale-95'
                  }`}
              >
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {loading ? 'hourglass_bottom' : 'north'}
                </span>
              </button>
            </div>
          </form>
          
          <div className="flex justify-center gap-6 mt-4">
            <span className="text-[9px] font-label font-bold uppercase tracking-[0.2em] text-on-surface-variant/30 transition-colors hover:text-on-surface-variant/60 cursor-default">
              Encrypted Archive
            </span>
            <span className="text-[9px] font-label font-bold uppercase tracking-[0.2em] text-on-surface-variant/30 transition-colors hover:text-on-surface-variant/60 cursor-default">
              AI Tutor v1.2
            </span>
            <span className="text-[9px] font-label font-bold uppercase tracking-[0.2em] text-on-surface-variant/30 transition-colors hover:text-on-surface-variant/60 cursor-default">
              Context Aware
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
