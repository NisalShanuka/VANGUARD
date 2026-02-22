export const smoothEase = [0.22, 1, 0.36, 1];

export const viewport = { once: true, amount: 0.2 };

export const stagger = (staggerChildren = 0.1, delayChildren = 0.05) => ({
  hidden: {},
  show: {
    transition: {
      staggerChildren,
      delayChildren,
    },
  },
});

export const fadeIn = (duration = 0.45, delay = 0) => ({
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration, delay, ease: smoothEase },
  },
});

export const fadeUp = (distance = 24, duration = 0.55, delay = 0) => ({
  hidden: { opacity: 0, y: distance },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration, delay, ease: smoothEase },
  },
});

export const popIn = (scale = 0.96, duration = 0.45, delay = 0) => ({
  hidden: { opacity: 0, scale },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration, delay, ease: smoothEase },
  },
});

export const pageTransition = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: smoothEase },
  },
  exit: {
    opacity: 0,
    y: -18,
    transition: { duration: 0.3, ease: 'easeInOut' },
  },
};

export const hoverLift = {
  y: -6,
  transition: { duration: 0.2, ease: 'easeOut' },
};

export const tapPress = {
  scale: 0.98,
};
