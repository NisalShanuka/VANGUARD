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
          <div className="flex flex-col items-center gap-5">
            <motion.img
              src="/images/logo.png"
              alt=""
              initial={{ opacity: 0, scale: 0.8, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.55, ease: smoothEase }}
              className="h-16 w-auto"
            />
            <div className="h-1 w-48 overflow-hidden rounded-none border border-white/10 bg-white/5">
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ repeat: Infinity, duration: 1.1, ease: 'easeInOut' }}
                className="h-full w-1/2 bg-white"
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
