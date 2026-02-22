"use client";
import { motion } from 'framer-motion';
import { pageTransition } from './motionPresets.js';

export default function AnimatedPage({ children }) {
    return (
        <motion.div
            initial="hidden"
            animate="show"
            exit="exit"
            variants={pageTransition}
        >
            {children}
        </motion.div>
    );
}
