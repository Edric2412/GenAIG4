'use client';

import React, { useState } from 'react';
import LayoutWrapper from '../../components/LayoutWrapper';
import { uploadFile } from '../../lib/api';

export default function UploadPage() {
  return (
    <LayoutWrapper>
      <UploadUI />
    </LayoutWrapper>
  );
}

function UploadUI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadProgress, setUploadProgress] = useState(null);
  const [discipline, setDiscipline] = useState('General');
  const [tags, setTags] = useState('');

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setError('');
    setSuccess('');
    setUploadProgress({ name: file.name, progress: 0 });

    try {
      // Simulate progress since fetch doesn't support it natively without XHR
      const interval = setInterval(() => {
        setUploadProgress(prev => prev ? { ...prev, progress: Math.min(prev.progress + 10, 90) } : null);
      }, 200);

      const data = await uploadFile(file, discipline);
      clearInterval(interval);
      
      setUploadProgress(prev => prev ? { ...prev, progress: 100 } : null);
      setSuccess(`Successfully indexed ${data.filename} (${data.chunks} chunks).`);
      
      setTimeout(() => setUploadProgress(null), 2000);
    } catch (err) {
      setError(err.message || 'Upload failed.');
      setUploadProgress(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 lg:p-12 max-w-4xl mx-auto">
      <header className="mb-12">
        <h2 className="font-headline text-5xl md:text-6xl tracking-tight text-on-surface mb-4">Upload Study Materials</h2>
        <p className="font-body text-on-surface-variant text-lg max-w-2xl">Deposit texts, manuscripts, and primary sources into the ethereal archive for immediate scholastic indexing.</p>
      </header>

      {error && (
        <div className="mb-6 bg-error-container/20 border border-error/50 text-error text-sm p-4 rounded-xl">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 bg-primary-container/20 border border-primary/50 text-primary text-sm p-4 rounded-xl">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <label className="relative bg-surface-container/80 backdrop-blur-xl border border-outline-variant/15 rounded-2xl p-12 flex flex-col items-center justify-center text-center group cursor-pointer transition-all hover:bg-surface-container-high/80 hover:border-primary/30 shadow-[inset_1px_1px_0px_rgba(218,228,229,0.05),inset_-1px_-1px_0px_rgba(63,72,73,0.05)] h-80">
            <input type="file" className="hidden" onChange={handleFileChange} disabled={loading} />
            <div className="absolute inset-0 bg-primary/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl"></div>
            <div className="relative z-10">
              <div className="w-20 h-20 rounded-full bg-surface-container-lowest flex items-center justify-center mb-6 mx-auto border border-outline-variant/20 shadow-[0_8px_32px_rgba(7,16,17,0.4)] group-hover:scale-110 transition-transform duration-500">
                <span className="material-symbols-outlined text-4xl text-primary font-light">cloud_upload</span>
              </div>
              <h3 className="font-headline text-2xl text-on-surface mb-2">Drag & Drop Manuscripts</h3>
              <p className="font-body text-sm text-on-surface-variant/70 mb-6">Supports PDF, DOCX, EPUB, and Plain Text files up to 500MB.</p>
              <div className="px-6 py-2.5 rounded-xl bg-surface-variant/20 backdrop-blur-md border border-outline-variant/15 text-primary font-medium text-sm hover:bg-surface-variant/40 transition-all shadow-[inset_1px_1px_0px_rgba(218,228,229,0.1),inset_-1px_-1px_0px_rgba(63,72,73,0.05)]">
                {loading ? 'Processing...' : 'Browse Device'}
              </div>
            </div>
          </label>

          {uploadProgress && (
            <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10 shadow-[inset_1px_1px_0px_rgba(218,228,229,0.05)]">
              <h4 className="font-headline text-xl text-on-surface mb-4">Active Transfers</h4>
              <div className="space-y-4">
                <div className="flex items-center gap-4 bg-surface-container/50 p-4 rounded-lg">
                  <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-primary text-xl">picture_as_pdf</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <p className="text-sm font-medium text-on-surface truncate">{uploadProgress.name}</p>
                      <span className="text-xs text-on-surface-variant">{uploadProgress.progress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary to-primary-container rounded-full transition-all duration-300" 
                        style={{ width: `${uploadProgress.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant/10 shadow-[inset_1px_1px_0px_rgba(218,228,229,0.05)] sticky top-28">
            <h3 className="font-headline text-2xl text-on-surface mb-6 border-b border-outline-variant/10 pb-4">Classification</h3>
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-2 tracking-wide uppercase">Discipline</label>
                <div className="relative">
                  <select value={discipline} onChange={(e) => setDiscipline(e.target.value)} className="w-full bg-surface-container-lowest border border-outline-variant/15 rounded-lg py-2.5 px-4 text-on-surface text-sm appearance-none focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 shadow-[inset_1px_1px_0px_rgba(218,228,229,0.05)]">
                    <option value="General">General</option>
                    <option value="Theoretical Physics">Theoretical Physics</option>
                    <option value="Classical Literature">Classical Literature</option>
                    <option value="Abstract Mathematics">Abstract Mathematics</option>
                    <option value="Philosophy">Philosophy</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-2 tracking-wide uppercase">Tags</label>
                <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} className="w-full bg-surface-container-lowest border border-outline-variant/15 rounded-lg py-2.5 px-4 text-on-surface text-sm focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 shadow-[inset_1px_1px_0px_rgba(218,228,229,0.05)] placeholder:text-on-surface-variant/40" placeholder="Add keywords..." />
              </div>

              <div className="pt-6 text-xs text-on-surface-variant italic">
                * Document will be automatically indexed upon selection.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
