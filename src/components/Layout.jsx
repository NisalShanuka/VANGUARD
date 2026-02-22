"use client";
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Background from './Background.jsx';
import Header from './Header.jsx';
import Footer from './Footer.jsx';
import LoadingScreen from './LoadingScreen.jsx';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { fadeUp, popIn } from './motionPresets.js';

const audioSrc = encodeURI(
  '/music/Where Im From  - Jay Princce Feat Costa, Puliya, DKM, & Master D, NST.mp3'
);

export default function Layout({ children }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.65);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    const loaderTimer = setTimeout(() => setIsLoading(false), 900);
    return () => clearTimeout(loaderTimer);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    audio.volume = volume;
    audio.muted = isMuted;

    void audio.play().catch(() => { });

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, []);

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      try {
        await audio.play();
      } catch (error) {
        return;
      }
    } else {
      audio.pause();
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    const nextMuted = !isMuted;
    audio.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const handleVolumeChange = (event) => {
    const nextVolume = Number(event.target.value);
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = nextVolume;
    setVolume(nextVolume);

    if (audio.muted && nextVolume > 0) {
      audio.muted = false;
      setIsMuted(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-black text-white">
      <LoadingScreen visible={isLoading} />
      <audio ref={audioRef} src={audioSrc} loop preload="metadata" />
      <Background />
      <Header />
      <main className="relative z-10 pt-[4.5rem] pb-20">
        {children}
      </main>
      <Footer />
      <motion.div
        initial="hidden"
        animate="show"
        variants={popIn(0.9, 0.4, 0.2)}
        whileHover={{ y: -2 }}
        className="fixed bottom-4 right-4 z-[60] flex flex-col gap-3 rounded-none border border-white/10 bg-ink-900/80 px-4 py-3 text-small uppercase tracking-[0.2em] text-white/80 shadow-lg backdrop-blur sm:bottom-6 sm:right-6 sm:px-5 sm:py-4"
      >
        <button
          type="button"
          onClick={togglePlayback}
          aria-pressed={isPlaying}
          aria-label={isPlaying ? t('layout.pauseMusicAria') : t('layout.playMusicAria')}
          className="flex items-center gap-3 transition hover:text-white focus:outline-none focus:ring-2 focus:ring-white/70"
        >
          <span
            className={`h-2.5 w-2.5 rounded-none transition ${isPlaying
              ? 'bg-white shadow-[0_0_12px_rgba(255,255,255,0.75)]'
              : 'bg-white/40'
              }`}
          />
          <span>{isPlaying ? t('layout.pauseMusic') : t('layout.playMusic')}</span>
        </button>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleMute}
            aria-pressed={isMuted}
            aria-label={isMuted ? t('layout.unmuteAria') : t('layout.muteAria')}
            className="transition hover:text-white focus:outline-none focus:ring-2 focus:ring-white/70"
          >
            {isMuted ? t('layout.unmute') : t('layout.mute')}
          </button>
          <label className="sr-only" htmlFor="background-volume">
            {t('layout.volumeLabel')}
          </label>
          <input
            id="background-volume"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            className="w-24 accent-white"
          />
        </div>
      </motion.div>
    </div>
  );
}
