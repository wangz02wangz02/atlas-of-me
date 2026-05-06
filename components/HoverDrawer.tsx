"use client";

import { useState, useRef, type ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";

type Side = "bottom" | "right";

type Props = {
  side: Side;
  /** Closed-state label/icon shown on the small handle. */
  handle?: ReactNode;
  /** Drawer body. */
  children: ReactNode;
  /** ms before closing after the cursor leaves. */
  closeDelay?: number;
  className?: string;
};

/**
 * Tab/handle that pulls a drawer out when hovered.
 * - Bottom side: handle pinned bottom-center, drawer slides up.
 * - Right side: handle pinned right-middle, drawer slides in from the right.
 */
export default function HoverDrawer({
  side,
  handle,
  children,
  closeDelay = 250,
  className = "",
}: Props) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<number | null>(null);

  const cancelClose = () => {
    if (closeTimer.current != null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = window.setTimeout(() => setOpen(false), closeDelay);
  };

  if (side === "bottom") {
    return (
      <div
        className={`pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center ${className}`}
        onMouseEnter={() => {
          cancelClose();
          setOpen(true);
        }}
        onMouseLeave={scheduleClose}
      >
        {/* Drawer body */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
              className="pointer-events-auto absolute bottom-7 mx-auto rounded-lg border border-paper-3 bg-paper/95 px-4 py-3 shadow-[0_-12px_40px_rgba(60,40,12,0.10)] backdrop-blur-md"
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Handle (always present) */}
        <motion.button
          type="button"
          aria-label="Open map options"
          onFocus={() => {
            cancelClose();
            setOpen(true);
          }}
          onBlur={scheduleClose}
          animate={{ y: open ? 4 : 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 24 }}
          className="pointer-events-auto absolute bottom-1 grid h-5 w-16 place-items-center rounded-t-md border border-b-0 border-paper-3 bg-paper/95 text-ink-faint shadow-sm transition hover:text-amber"
        >
          <svg width="14" height="8" viewBox="0 0 14 8" fill="none">
            <path
              d="M1 7 L7 1 L13 7"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.button>
      </div>
    );
  }

  // Right side
  return (
    <div
      className={`pointer-events-none fixed inset-y-0 right-0 z-30 flex items-center ${className}`}
      onMouseEnter={() => {
        cancelClose();
        setOpen(true);
      }}
      onMouseLeave={scheduleClose}
    >
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 60, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="pointer-events-auto absolute right-7 w-72 max-w-[90vw] rounded-lg border border-paper-3 bg-paper/95 p-4 shadow-[-12px_0_40px_rgba(60,40,12,0.08)] backdrop-blur-md"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        aria-label="Open place info"
        onFocus={() => {
          cancelClose();
          setOpen(true);
        }}
        onBlur={scheduleClose}
        animate={{ x: open ? -4 : 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 24 }}
        className="pointer-events-auto absolute right-1 grid h-16 w-5 place-items-center rounded-l-md border border-r-0 border-paper-3 bg-paper/95 text-ink-faint shadow-sm transition hover:text-amber"
      >
        {handle ?? (
          <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
            <path
              d="M7 1 L1 7 L7 13"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </motion.button>
    </div>
  );
}
