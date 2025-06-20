import { motion as Motion, AnimatePresence } from "framer-motion";

// Modal glassy avec overlay et anims
export default function ModalGlass({ open, onClose, children }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay glass */}
          <Motion.div
            className="fixed inset-0 bg-gradient-to-br from-[#0f1c2e99] via-[#fff4e144] to-[#bfa14d55] z-40 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          {/* Modale animée */}
          <Motion.div
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 230, damping: 22 }}
          >
            <div
              className="relative p-8 rounded-2xl shadow-2xl bg-white/40 dark:bg-[#222634]/60 border border-mamastockGold/25 pointer-events-auto backdrop-blur-xl shadow-[0_8px_40px_0_#bfa14d55,0_1.5px_12px_0_#2a304130,0_0_80px_0_#fff8e144] min-w-[340px] max-w-[420px] mx-auto"
            >
              <button
                className="absolute top-3 right-3 bg-mamastockGold/20 hover:bg-mamastockGold/40 rounded-full p-2 transition"
                onClick={onClose}
                aria-label="Fermer"
                type="button"
              >
                <span className="text-lg font-bold text-mamastockGold">×</span>
              </button>
              {children}
            </div>
          </Motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
