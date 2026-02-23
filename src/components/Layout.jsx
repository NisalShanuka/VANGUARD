"use client";
import { useEffect, useState } from 'react';
import Background from './Background.jsx';
import Header from './Header.jsx';
import Footer from './Footer.jsx';
import LoadingScreen from './LoadingScreen.jsx';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { fadeUp, popIn } from './motionPresets.js';

export default function Layout({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    const loaderTimer = setTimeout(() => setIsLoading(false), 900);
    return () => clearTimeout(loaderTimer);
  }, []);

  return (
    <div className="relative min-h-screen text-white bg-transparent">
      <LoadingScreen visible={isLoading} />
      <Background />
      <Header />
      <main className="relative z-10 pt-[4.5rem] pb-20">
        {children}
      </main>
      <Footer />
    </div>
  );
}
