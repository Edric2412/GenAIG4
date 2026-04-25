'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

export default function ChatMessage({ message, isLast, loading, onRegenerate }) {
  const [copied, setCopied] = useState(false);
  const isTutor = message.role === 'tutor';
  
  const handleCopy = () => {
    const textToCopy = isTutor ? message.text.split('---SOURCES---')[0] : message.text;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 1. Parse Source Mapping from the message text
  const parseSources = (text) => {
    const sources = {};
    const sourceMatch = text.match(/---SOURCES---([\s\S]*?)---END---/);
    if (sourceMatch) {
      const lines = sourceMatch[1].trim().split('\n');
      lines.forEach(line => {
        const parts = line.split(':');
        if (parts.length >= 2) {
          const id = parts[0].trim();
          const detail = parts.slice(1).join(':').trim();
          const [file, topic] = detail.split('|').map(s => s.trim());
          sources[id] = { file, topic };
        }
      });
    }
    return sources;
  };

  const sourceMap = isTutor ? parseSources(message.text || "") : {};
  // Clean text for display
  const displayText = isTutor ? (message.text || "").split('---SOURCES---')[0].trim() : message.text;

  // Custom component for the numbered citation box
  const Citation = ({ id }) => {
    const info = sourceMap[id] || { file: "Unknown Source", topic: "General Reference" };
    
    return (
      <span className="inline-flex items-center group/cite relative mx-0.5 align-baseline">
        <span className="cursor-help bg-primary/20 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded-md border border-primary/30 hover:bg-primary hover:text-on-primary transition-all duration-300 transform hover:-translate-y-0.5 shadow-sm">
          {id}
        </span>
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-[240px] p-3 bg-surface-container-highest border border-outline-variant/30 rounded-xl text-on-surface shadow-2xl opacity-0 group-hover/cite:opacity-100 pointer-events-none transition-all duration-300 z-50 backdrop-blur-xl scale-95 group-hover/cite:scale-100 origin-bottom flex flex-col">
          <span className="flex items-center gap-2 mb-2 pb-2 border-b border-outline-variant/10">
            <span className="material-symbols-outlined text-primary text-lg">verified_user</span>
            <span className="text-[11px] font-black uppercase tracking-widest text-primary">Syllabus Context</span>
          </span>
          <span className="flex flex-col gap-2">
            <span className="flex flex-col">
              <span className="text-[9px] font-bold text-on-surface-variant/50 uppercase tracking-tighter">Document</span>
              <span className="text-[12px] font-medium text-on-surface truncate block">{info.file}</span>
            </span>
            <span className="flex flex-col">
              <span className="text-[9px] font-bold text-on-surface-variant/50 uppercase tracking-tighter">Topic/Section</span>
              <span className="text-[12px] text-primary/90 font-semibold italic block leading-tight mt-0.5">"{info.topic}"</span>
            </span>
          </span>
          <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-0.5 border-8 border-transparent border-t-surface-container-highest block w-0 h-0"></span>
        </span>
      </span>
    );
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
            (!displayText || displayText.length === 0) && loading ? (
              <div className="flex flex-col gap-3 py-2">
                <div className="flex items-center gap-3 animate-pulse">
                  <div className="w-4 h-4 rounded-full border-2 border-primary/30 border-t-primary animate-spin"></div>
                  <span className="text-[10px] font-label font-bold uppercase tracking-[0.2em] text-primary/60">
                    Consulting Ethereal Archive...
                  </span>
                </div>
                <div className="space-y-2 opacity-20">
                  <div className="h-2 w-full bg-primary/20 rounded-full animate-pulse"></div>
                  <div className="h-2 w-5/6 bg-primary/20 rounded-full animate-pulse delay-75"></div>
                  <div className="h-2 w-4/6 bg-primary/20 rounded-full animate-pulse delay-150"></div>
                </div>
              </div>
            ) : (
              <ReactMarkdown 
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                  p: ({node, ...props}) => {
                      const children = React.Children.map(props.children, child => {
                          if (typeof child === 'string') {
                              const parts = child.split(/(\[\^[0-9]+\])/g);
                              return parts.map((part, i) => {
                                  if (part.startsWith('[^') && part.endsWith(']')) {
                                      const id = part.slice(2, -1);
                                      return <Citation key={i} id={id} />;
                                  }
                                  return part;
                              });
                          }
                          return child;
                      });
                      return <div className="mb-4 last:mb-0">{children}</div>;
                  }
                }}
              >
                {displayText}
              </ReactMarkdown>
            )
          ) : (
            <p className="whitespace-pre-wrap">{message.text}</p>
          )}
        </div>

        {isTutor && displayText && (
          <div className="mt-6 pt-4 border-t border-outline-variant/5 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="flex gap-1">
              <button 
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-container-high/50 hover:bg-surface-container-highest transition-colors border border-outline-variant/10"
              >
                <span className="material-symbols-outlined text-sm">{copied ? 'done' : 'content_copy'}</span>
                <span className="text-[10px] font-bold uppercase tracking-tight">{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <button 
                onClick={onRegenerate}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-container-high/50 hover:bg-surface-container-highest transition-colors border border-outline-variant/10"
              >
                <span className="material-symbols-outlined text-sm">refresh</span>
                <span className="text-[10px] font-bold uppercase tracking-tight">Regenerate</span>
              </button>
            </div>
            <div className="flex gap-2 text-on-surface-variant/30 italic text-[10px]">
              Atlas v1.2 • Math & Citations Active
            </div>
          </div>
        )}

        {/* Streaming Indicator */}
        {isTutor && loading && isLast && displayText !== "" && (
          <div className="absolute -bottom-1 left-6 right-6 h-[2px] bg-gradient-to-r from-transparent via-primary/40 to-transparent animate-pulse"></div>
        )}
      </div>
    </div>
  );
}
