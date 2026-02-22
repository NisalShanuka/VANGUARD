"use client";
import { motion } from 'framer-motion';

export default function Background() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-[#050505]">
      {/* Dynamic faint Grid Background */}
      <motion.div
        aria-hidden="true"
        animate={{ opacity: [0.15, 0.3, 0.15] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-0 grid-overlay"
      />

      {/* Radial fade to black at edges so content stands out */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#050505_90%)]" />

      {/* Modern animated subtle light beams/orbs representing "Metallic/Glass" vibes */}
      <motion.div
        animate={{ opacity: [0.08, 0.15, 0.08], scale: [1, 1.2, 1], x: [0, 50, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-[10%] right-[-5%] h-[600px] w-[600px] rounded-full bg-white/10 blur-[130px]"
      />
      <motion.div
        animate={{ opacity: [0.05, 0.1, 0.05], scale: [1, 1.1, 1], y: [0, -50, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        className="absolute left-[-15%] top-[20%] h-[500px] w-[500px] rounded-full bg-accent-400/10 blur-[120px]"
      />
      <motion.div
        animate={{ opacity: [0.03, 0.08, 0.03], scale: [1, 1.3, 1], x: [0, -40, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
        className="absolute bottom-[-10%] left-[10%] h-[800px] w-[800px] rounded-full bg-white/5 blur-[160px]"
      />

      {/* Abstract metallic diagonal styling (Very faint) */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="w-full h-full diagonal-stripes" />
      </div>

    </div>
  );
}
