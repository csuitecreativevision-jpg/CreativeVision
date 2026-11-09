import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

const isServer = typeof window === 'undefined';

/**
 * Fades its content in the first time it scrolls into view. In the pre-built page (for search
 * engines) it's a plain block, so the text is there from the start.
 */
export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  if (isServer) return <div className={className}>{children}</div>;
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** The small rounded label above a section heading. */
export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="glass-panel mb-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-white/75">
      <span className="h-1.5 w-1.5 rounded-full bg-violet-400" aria-hidden="true" />
      {children}
    </p>
  );
}
