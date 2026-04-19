'use client';

import React, { useEffect, useState, createContext, useContext } from 'react';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';
import { usePathname, useRouter } from 'next/navigation';

export const SubjectContext = createContext({
  selectedSubject: 'all',
  setSelectedSubject: () => {}
});

export const useSubject = () => useContext(SubjectContext);

export default function LayoutWrapper({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState('all');
  
  useEffect(() => {
    const savedRole = localStorage.getItem('atlas_role');
    if (!savedRole) {
      router.push('/login');
      return;
    }
    setRole(savedRole);

    // Strict role protection
    if (savedRole === 'student' && (pathname === '/upload' || pathname === '/library')) {
      router.push('/chat');
    }
    if (savedRole === 'admin' && pathname === '/chat') {
      router.push('/upload');
    }
  }, [pathname, router]);

  if (!role) return null;

  const studentLinks = [
    { icon: 'chat_bubble', label: 'Current Session', href: '/chat' },
  ];

  const adminLinks = [
    { icon: 'cloud_upload', label: 'Upload Center', href: '/upload' },
    { icon: 'auto_stories', label: 'Document Library', href: '/library' },
  ];

  const links = role === 'admin' ? adminLinks : studentLinks;

  return (
    <SubjectContext.Provider value={{ selectedSubject, setSelectedSubject }}>
      <div className="flex h-screen w-full bg-background overflow-hidden">
        {/* Sidebar - No longer fixed, just a flex item */}
        <div className="hidden md:block w-72 h-full flex-shrink-0">
          <Sidebar 
            subtext={role === 'admin' ? "Management Portal" : "The Ethereal Archive"} 
            links={links} 
          />
        </div>

        <div className="flex-1 flex flex-col relative h-full min-w-0">
          {/* Abstract Background Glow */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
            <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px]"></div>
            <div className="absolute bottom-[-10%] left-[20%] w-[60%] h-[60%] rounded-full bg-tertiary/5 blur-[150px]"></div>
          </div>
          
          <TopNavbar 
            showSearch={pathname === '/library' || pathname === '/upload'} 
            profileImg={role === 'admin' ? "https://lh3.googleusercontent.com/aida-public/AB6AXuD1vIGhjLw2F3I7I973UsGUe4Jba4YF59_pf3CzrTsAies38Yw5hrcZmbw5wUHhmf5ANRcDGUjZ1jLOlhSfixJfOz3UvpqeckeuxMjru-oOYGNiuxTqAKKNFsolsPffAoDGrSJ8O0OaCtfLO4eAblCA2ITGI9TG9tlKSEJ2-84SO_r9wP96ovjbUygnqmE1ZubbVfmVn-3q1FceapeEeKFBfHiXfs2Uj9WvUbbcfocTyMUQMVgxr0b7jaOgYrv7cFVs0nfE4gO87XE" : undefined}
            onSubjectChange={setSelectedSubject}
          />
          
          <main className="flex-1 z-10 relative overflow-hidden flex flex-col">
            {children}
          </main>
        </div>
      </div>
    </SubjectContext.Provider>
  );
}
