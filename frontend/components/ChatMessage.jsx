'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';

export default function ChatMessage({ message, isLast, loading }) {
  const [copied, setCopied] = useState(false);
  const isTutor = message.role === 'tutor';
  
  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`group flex flex-col gap-3 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 ${isTutor ? '' : 'items-end'}`}>
      <div className={`flex items-center gap-2 px-1 ${isTutor ? '' : 'flex-row-reverse'}`}>
        <div className={`w-6 h-6 rounded-full overflow-hidden border border-outline-variant/20 flex-shrink-0 bg-surface-container`}>
          <img 
            src={isTutor ? "https://lh3.googleusercontent.com/aida-public/AB6AXuDgJ5nEYBI30SvZ_aSHeZTVBQpTF9INbMon2vw152jOltMlNknJQ7l8g5gJ3Lcbuf5drBpfit8ncXF0aJfxQhjSdoeNH1Yq6gUekaKVGLrLu8S24kbOEwo6uR7BxTIfPZ1wRaJfxGfD5-3E2W0jWGo0-nf5Op3KAbwuYlrruDhegbmnEJQtxTBvLwu2inQLEXyeQrEuw9eJT3cX5iPekvvIIXgoWDzF-dtI8UoFmhTv0H3jOFTBf3QJNpoLNpKqebUcTN1w147mhxg" : "https://lh3.googleusercontent.com/aida-public/AB6AXuChHRHaQuioLNKXVl4mY2pVNFzP24OqzkAfR-UF2uNHjox-uHm-_vStuDSqGYeN_BTgjtHHmJUj6tnlwkvv6Syy64hSJqc7jpoZqVs6eQoOXXJHUJqd9o2e_jlh0u9fdHjnpUVL15rxo_bpFDF6bmzi5WWxp0ghxOt3aDS5Aml-Wr4ekmXd3-MQ8SSyEoFLnOi6ovuXX3vAt_mYHl0TqdFU6e9vJ7VHug6W6bLMAKbMY8-blZCSwT2ONj4JkcZSnVmBZjGJ2W8ygIo"} 
            alt={isTutor ? "Atlas" : "Student"} 
            className="w-full h-full object-cover" 
          />
        </div>
        <span className="text-[10px] font-label font-bold uppercase tracking-wider text-on-surface-variant/70">
          {isTutor ? 'Atlas' : 'You'}
        </span>
        {isTutor && (
          <span className="bg-primary/10 text-primary text-[8px] px-1.5 py-0.5 rounded-full border border-primary/20 font-bold tracking-tighter">
            ARCHIVE ACCESS
          </span>
        )}
      </div>

      <div className={`relative max-w-[90%] md:max-w-[85%] rounded-2xl p-4 md:p-6 transition-all duration-300
        ${isTutor 
          ? 'bg-surface-container-low/40 border border-outline-variant/10 shadow-sm backdrop-blur-xl' 
          : 'bg-primary-container/20 border border-primary/20 text-on-surface shadow-lg shadow-primary/5'
        } ${message.isError ? 'border-error/40 bg-error-container/10' : ''}`}>
        
        {message.title && (
          <h3 className="font-headline text-lg md:text-xl mb-4 text-primary font-medium tracking-tight border-b border-outline-variant/10 pb-2">
            {message.title}
          </h3>
        )}

        <div className={`font-body leading-relaxed text-sm md:text-base ${isTutor ? 'text-on-surface-variant' : 'text-on-surface'} markdown-content`}>
          {isTutor ? (
            <ReactMarkdown>{message.text || (loading && '...')}</ReactMarkdown>
          ) : (
            <p className="whitespace-pre-wrap">{message.text}</p>
          )}
        </div>

        {isTutor && message.citations && message.citations.length > 0 && (
          <div className="mt-5 pt-4 border-t border-outline-variant/5">
            <span className="text-[10px] font-label font-bold uppercase tracking-wider text-on-surface-variant/50 flex items-center gap-1.5 mb-2">
              <span className="material-symbols-outlined text-xs">library_books</span>
              Referenced Sources
            </span>
            <div className="flex flex-wrap gap-2">
              {message.citations.map((cite, i) => (
                <span key={i} className="flex items-center gap-1.5 bg-surface-container-high px-2.5 py-1 rounded-lg text-[10px] font-medium text-on-surface-variant/90 border border-outline-variant/10 transition-all hover:bg-surface-container-highest hover:border-primary/20 cursor-default">
                  <span className="material-symbols-outlined text-[12px] opacity-60 text-primary">description</span>
                  {cite}
                </span>
              ))}
            </div>
          </div>
        )}

        {isTutor && message.text && (
          <div className="mt-6 pt-4 border-t border-outline-variant/5 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="flex gap-1">
              <button 
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-container-high/50 hover:bg-surface-container-highest transition-colors border border-outline-variant/10"
              >
                <span className="material-symbols-outlined text-sm">{copied ? 'done' : 'content_copy'}</span>
                <span className="text-[10px] font-bold uppercase tracking-tight">{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-container-high/50 hover:bg-surface-container-highest transition-colors border border-outline-variant/10">
                <span className="material-symbols-outlined text-sm">refresh</span>
                <span className="text-[10px] font-bold uppercase tracking-tight">Regenerate</span>
              </button>
            </div>
            <div className="flex gap-2 text-on-surface-variant/30 italic text-[10px]">
              Atlas v1.2 • Ethereal Archive Mode
            </div>
          </div>
        )}

        {/* Streaming Indicator */}
        {isTutor && loading && isLast && (
          <div className="absolute -bottom-1 left-6 right-6 h-[2px] bg-gradient-to-r from-transparent via-primary/40 to-transparent animate-pulse"></div>
        )}
      </div>
    </div>
  );
}
