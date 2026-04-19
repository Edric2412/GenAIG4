'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginUser } from '../../lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');

    try {
      const data = await loginUser(email, password);
      localStorage.setItem('atlas_role', data.role);
      
      if (data.role === "admin") {
        router.push("/upload");
      } else {
        router.push("/chat");
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background text-on-surface font-body min-h-screen flex flex-col md:flex-row overflow-hidden antialiased w-full">
      {/* Visual Split Side */}
      <div className="hidden md:flex md:w-1/2 relative bg-surface-container-lowest border-r border-outline-variant/20 items-center justify-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-primary-container/20 rounded-full blur-[100px]"></div>
        </div>
        <div className="absolute top-20 left-20 w-72 h-72 rounded-full glass-panel opacity-60"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 rounded-[3rem] rotate-12 glass-panel opacity-80"></div>
        <div className="absolute top-1/2 right-1/3 w-48 h-48 rounded-xl -rotate-12 glass-panel opacity-40"></div>
        <div className="relative z-10 p-16 w-full h-full flex flex-col justify-end">
          <div className="glass-panel p-10 rounded-2xl max-w-lg border border-outline-variant/20 shadow-2xl">
            <span className="material-symbols-outlined text-primary text-4xl mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>menu_book</span>
            <h2 className="font-headline text-4xl font-semibold tracking-tight text-on-surface mb-3">Vitreous Scholastic</h2>
            <p className="font-body text-base text-on-surface-variant leading-relaxed">
              Illuminate your academic journey. Atlas Tutor combines the vast ethereal archive with cutting-edge artificial intelligence to elevate your learning experience.
            </p>
          </div>
        </div>
      </div>
      {/* Form Split Side */}
      <div className="w-full md:w-1/2 flex flex-col h-screen overflow-y-auto bg-surface relative">
        <main className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md flex flex-col gap-10">
            <header className="text-left space-y-3">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-surface-container-lowest/50 backdrop-blur-md mb-2 shadow-[inset_1px_1px_0_0_rgba(218,228,229,0.1),inset_-1px_-1px_0_0_rgba(63,72,73,0.05)] border border-outline-variant/15">
                <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              </div>
              <h1 className="font-headline text-4xl font-semibold tracking-tight text-on-surface">Atlas Tutor</h1>
              <p className="font-body text-base text-on-surface-variant tracking-wide">AI-Powered Academic Assistant</p>
            </header>
            <form className="flex flex-col gap-6" onSubmit={handleLogin}>
              <div className="space-y-5">
                {error && (
                  <div className="bg-error-container/20 border border-error/50 text-error text-sm p-3 rounded-lg">
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <label className="font-label text-sm font-medium text-on-surface-variant block ml-1" htmlFor="email">Email</label>
                  <div className="relative input-glow transition-shadow duration-300 rounded-lg">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="material-symbols-outlined text-on-surface-variant/60 text-xl">mail</span>
                    </div>
                    <input className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg py-3.5 pl-12 pr-4 text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary focus:ring-0 transition-colors bg-opacity-80" id="email" name="email" placeholder="name@institution.edu" required type="email"/>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center ml-1">
                    <label className="font-label text-sm font-medium text-on-surface-variant block" htmlFor="password">Password</label>
                    <a className="text-xs text-primary hover:text-primary-fixed transition-colors font-medium" href="#">Forgot password?</a>
                  </div>
                  <div className="relative input-glow transition-shadow duration-300 rounded-lg">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="material-symbols-outlined text-on-surface-variant/60 text-xl">lock</span>
                    </div>
                    <input className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg py-3.5 pl-12 pr-4 text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary focus:ring-0 transition-colors bg-opacity-80" id="password" name="password" placeholder="••••••••" required type="password"/>
                  </div>
                </div>
              </div>
              <button disabled={loading} className="mt-4 w-full bg-gradient-to-br from-primary to-primary-container text-on-primary font-label font-medium text-base py-3.5 px-6 rounded-xl hover:opacity-90 transition-opacity flex justify-center items-center gap-2 shadow-lg shadow-primary/10 disabled:opacity-50" type="submit">
                {loading ? 'Logging in...' : 'Login'}
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </button>
              <p className="text-center font-body text-xs text-on-surface-variant/70 mt-2">
                Enter your credentials to access your dashboard.
              </p>
            </form>
          </div>
        </main>
        <footer className="w-full flex flex-col md:flex-row justify-between items-center px-8 py-8 z-10">
          <p className="font-headline text-[#55d7ed] italic text-sm">Atlas Tutor</p>
          <p className="font-body text-sm tracking-wide text-on-surface-variant/60 mt-4 md:mt-0">© 2024 The Ethereal Archive. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
