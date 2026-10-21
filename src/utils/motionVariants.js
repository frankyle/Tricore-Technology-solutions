// Shared, lightweight animation variants used across sections to keep
// motion consistent and simple across the site.

export const staggerContainer = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

export const fadeUpItem = {
  hidden: { opacity: 0, y: 22 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

// Sensible defaults for wrapping a grid/list in whileInView so the
// stagger only plays once, the first time it scrolls into view.
export const revealOnScroll = {
  variants: staggerContainer,
  initial: "hidden",
  whileInView: "show",
  viewport: { once: true, amount: 0.2 },
};
