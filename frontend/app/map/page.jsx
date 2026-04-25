'use client';

import React, { useState, useEffect } from 'react';
import LayoutWrapper from '../../components/LayoutWrapper';
import { getNomicMap } from '../../lib/api';

export default function MapPage() {
  return (
    <LayoutWrapper>
      <KnowledgeMapUI />
    </LayoutWrapper>
  );
}

function KnowledgeMapUI() {
  const [mapUrl, setMapUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const savedUrl = localStorage.getItem('atlas_knowledge_map_url');
    if (savedUrl) {
      setMapUrl(savedUrl);
    }
  }, []);

  const generateMap = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getNomicMap();
      if (data && data.map_url) {
        setMapUrl(data.map_url);
        localStorage.setItem('atlas_knowledge_map_url', data.map_url);
      } else {
        throw new Error("No map URL returned from server.");
      }
    } catch (err) {
      console.error("Map Generation Error:", err);
      setError(err.message || 'Failed to generate map. Ensure documents are uploaded.');
    } finally {
      setLoading(false);
    }
  };

  // Prevent hydration mismatch by not rendering state-dependent content until mounted
  if (!isMounted) {
    return <div className="flex-1 bg-background"></div>;
  }

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Header */}
      <div className="px-8 py-6 border-b border-outline-variant/10 bg-surface-container-low/30 backdrop-blur-md flex justify-between items-center z-30">
        <div>
          <h1 className="font-headline text-4xl text-on-surface tracking-tight">
            Knowledge Universe
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Interactive visualization of your syllabus connections
          </p>
        </div>
        
        <button
          onClick={generateMap}
          disabled={loading}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-label text-sm transition-all
            ${loading 
              ? 'bg-surface-container text-on-surface-variant cursor-not-allowed opacity-50' 
              : 'bg-primary text-on-primary hover:scale-105 shadow-lg shadow-primary/20'
            }`}
        >
          <span className="material-symbols-outlined text-[20px] animate-none">
            {loading ? 'sync' : 'auto_graph'}
          </span>
          {loading ? 'Mapping Vectors...' : 'Sync Knowledge Map'}
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 relative bg-[#000] overflow-hidden">
        {mapUrl ? (
          <div className="w-full h-full">
             <iframe
                key={mapUrl}
                src={mapUrl}
                className="w-full h-full border-none"
                title="Nomic Atlas Knowledge Map"
                allow="clipboard-read; clipboard-write"
              ></iframe>
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 bg-[#050505]">
            <div className="w-24 h-24 rounded-full bg-primary/5 border border-primary/20 flex items-center justify-center mb-6 animate-pulse">
              <span className="material-symbols-outlined text-4xl text-primary/40">language</span>
            </div>
            <h2 className="text-xl font-headline text-on-surface mb-2 tracking-tight">The Universe is Empty</h2>
            <p className="max-w-md text-on-surface-variant/60 text-sm leading-relaxed mb-8">
              Your syllabus has not been mapped into the visual archive yet. Click the button above to project your knowledge base into an interactive 3D universe.
            </p>
            {error && (
              <div className="p-4 rounded-xl bg-error-container/10 border border-error/20 text-error text-xs font-medium max-w-sm">
                Error: {error}
              </div>
            )}
          </div>
        )}

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 animate-in fade-in duration-500">
             <div className="flex flex-col items-center gap-6">
                <div className="relative">
                    <div className="w-20 h-20 border-4 border-primary/10 rounded-full"></div>
                    <div className="absolute top-0 left-0 w-20 h-20 border-4 border-transparent border-t-primary rounded-full animate-spin"></div>
                </div>
                <div className="flex flex-col items-center gap-2">
                    <span className="font-label text-xs font-bold uppercase tracking-[0.4em] text-primary animate-pulse">
                        Projecting Archive
                    </span>
                    <span className="text-[10px] text-on-surface-variant/40 italic uppercase tracking-widest">
                        Performing Dimensionality Reduction...
                    </span>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
