'use client';

import React, { useState, useEffect } from 'react';
import LayoutWrapper from '../../components/LayoutWrapper';
import { getDocuments, deleteDocument } from '../../lib/api';

export default function LibraryPage() {
  return (
    <LayoutWrapper>
      <LibraryUI />
    </LayoutWrapper>
  );
}

function LibraryUI() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const data = await getDocuments();
      setDocuments(data);
    } catch (err) {
      setError('Failed to load documents.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleDelete = async (id, filename) => {
    if (!confirm(`Are you sure you want to delete ${filename}?`)) return;

    try {
      await deleteDocument(id);
      setDocuments(docs => docs.filter(doc => doc.id !== id));
    } catch (err) {
      alert('Failed to delete document.');
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.filename.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = filterSubject === 'all' || doc.subject === filterSubject;
    return matchesSearch && matchesSubject;
  });

  const uniqueSubjects = [...new Set(documents.map(doc => doc.subject).filter(Boolean))];

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto flex flex-col gap-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="font-headline text-4xl md:text-5xl text-on-surface tracking-tight leading-tight mb-2">
            Document Library
          </h2>
          <p className="font-body text-on-surface-variant max-w-2xl text-sm md:text-base">
            Manage uploaded study materials and knowledge sources. Curate the digital archive.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-error-container/20 border border-error/50 text-error text-sm p-4 rounded-xl">
          {error}
        </div>
      )}

      <div className="bg-surface-container-low/50 border border-outline-variant/15 rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-center justify-between backdrop-blur-sm">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-48">
            <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)} className="w-full appearance-none bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-4 py-2 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 cursor-pointer">
              <option value="all">All Subjects</option>
              {uniqueSubjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-sm">expand_more</span>
          </div>
        </div>
        <div className="relative w-full sm:w-64">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
          <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg pl-9 pr-4 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all" placeholder="Filter by filename..." type="text"/>
        </div>
      </div>

      <div className="flex flex-col">
        <div className="grid grid-cols-[minmax(200px,2fr)_100px] gap-4 px-6 py-3 text-xs font-medium text-on-surface-variant uppercase tracking-wider border-b border-outline-variant/10">
          <div>File Name</div>
          <div className="text-right">Actions</div>
        </div>
        <div className="flex flex-col gap-2 mt-3">
          {loading ? (
            <div className="text-center py-10 text-on-surface-variant">Loading archive...</div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-10 text-on-surface-variant">No documents found.</div>
          ) : (
            filteredDocuments.map((doc, idx) => (
              <div key={idx} className="group grid grid-cols-[minmax(200px,2fr)_100px] gap-4 items-center bg-surface-container-low/30 hover:bg-surface-container/60 border border-outline-variant/10 hover:border-outline-variant/20 rounded-xl px-6 py-4 transition-all duration-300">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-8 h-8 rounded bg-surface-container-highest flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-primary text-sm">description</span>
                  </div>
                  <span className="text-sm font-medium text-on-surface truncate">{doc.filename}</span>
                </div>
                <div className="flex justify-end gap-2">
                  <button 
                    onClick={() => handleDelete(doc.id, doc.filename)}
                    className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error/10 rounded transition-colors" 
                    title="Delete"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
