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
        <p className="section-kicker">
          {subtitle}
        </p>
      )}
      <div className="mt-4 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="section-title">
            {title}
            {accent && <span className="text-white"> {accent}</span>}
          </h1>
          {description && (
            <p className="mt-4 max-w-2xl text-body text-white/70">
              {description}
            </p>
          )}
        </div>
      </div>
    </motion.section>
  );
}
