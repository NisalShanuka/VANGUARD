"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Template({ children }) {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Keeps the loading spinner active for 450ms for the animation to play
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 450);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="relative w-full flex-grow">
            <AnimatePresence mode="wait">
                {isLoading ? (
                    <motion.div
                        key="loader"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 backdrop-blur-md"
                    >
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
                    </motion.div>
                ) : (
                    <motion.div
                        key="content"
                        initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="w-full h-full"
                    >
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
