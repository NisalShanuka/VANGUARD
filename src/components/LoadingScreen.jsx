"use client";
import { AnimatePresence, motion } from 'framer-motion';
import { fadeIn, smoothEase } from './motionPresets.js';

export default function LoadingScreen({ visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial="hidden"
          animate="show"
          exit={{ opacity: 0, transition: { duration: 0.35, ease: smoothEase } }}
          variants={fadeIn(0.3)}
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/95 backdrop-blur"
          aria-hidden="true"
        >
          <div className="flex flex-col items-center gap-8">
            <motion.img
              src="/images/logo.png"
              alt=""
              initial={{ opacity: 0, scale: 0.8, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.55, ease: smoothEase }}
              className="h-16 w-auto"
            />
            <div className="relative flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="h-12 w-12 rounded-full border-4 border-white/10 border-t-accent-400 shadow-[0_0_15px_#c8c8c84d]"
              />
              <motion.div
                animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                className="absolute inset-[-6px] rounded-full border border-white/5"
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
