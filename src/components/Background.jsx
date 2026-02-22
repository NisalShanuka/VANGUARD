import { motion } from 'framer-motion';

export default function Background() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
      <motion.div
        aria-hidden="true"
        animate={{ opacity: [0.2, 0.3, 0.2] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-0 grid-overlay"
      />
      <motion.div
        animate={{ opacity: [0.1, 0.15, 0.1] }}
        transition={{ duration: 10, repeat: Infinity }}
        className="absolute -top-40 right-[-15%] h-[420px] w-[420px] rounded-none bg-white/10 blur-[60px]"
      />
      <motion.div
        animate={{ opacity: [0.1, 0.12, 0.1] }}
        transition={{ duration: 12, repeat: Infinity }}
        className="absolute left-[-10%] top-[15%] h-[360px] w-[360px] rounded-none bg-white/10 blur-[60px]"
      />
      <motion.div
        animate={{ opacity: [0.05, 0.08, 0.05] }}
        transition={{ duration: 14, repeat: Infinity }}
        className="absolute bottom-[-20%] right-[10%] h-[440px] w-[440px] rounded-none bg-white/5 blur-[80px]"
      />
    </div>
  );
}
