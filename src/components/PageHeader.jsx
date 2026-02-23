"use client";
import { motion } from 'framer-motion';
import { fadeUp, stagger, viewport } from './motionPresets.js';

export default function PageHeader({ title, subtitle, description, accent }) {
  return (
    <motion.section
      initial="hidden"
      animate="show"
      variants={fadeUp(20, 0.6, 0.1)}
      className="mx-auto max-w-6xl px-6 pb-12 pt-10"
    >
      {subtitle && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-6"
        >
          <div className="w-1 h-1 rounded-full bg-white animate-pulse" />
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40">
            {subtitle}
          </p>
        </motion.div>
      )}
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between relative">
        {/* Decorative background glow */}
        <div className="absolute -left-20 -top-20 w-64 h-64 bg-white/5 rounded-full blur-[100px] -z-10" />

        <div className="relative z-10 w-full">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-black uppercase tracking-tight leading-[0.9] text-white break-words">
            <span className="bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">
              {title}
            </span>
            {accent && <span className="text-white/20 block md:inline md:ml-4"> {accent}</span>}
          </h1>
          {description && (
            <p className="mt-8 max-w-2xl text-sm md:text-base leading-relaxed text-white/40 font-medium border-l border-white/10 pl-6">
              {description}
            </p>
          )}
        </div>
      </div>
    </motion.section>
  );
}
