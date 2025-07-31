// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from "react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { useHelp } from "@/context/HelpProvider";

export default function GuidedTour({ steps = [], module }) {
  const { markGuideSeen } = useHelp();
  const [current, setCurrent] = useState(0);
  const [coords, setCoords] = useState(null);

  useEffect(() => {
    if (current >= steps.length) {
      if (module) markGuideSeen(module);
      return;
    }
    const sel = steps[current]?.target;
    if (!sel) return;
    const el = document.querySelector(sel);
    if (el) {
      const rect = el.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
      });
    }
  }, [current, steps]);

  if (current >= steps.length) return null;

  const step = steps[current];

  return (
    <AnimatePresence>
      {coords && (
        <Motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          className="fixed z-50 bg-white/10 border border-white/20 backdrop-blur-xl text-white p-4 rounded-xl shadow-xl"
          style={{ top: coords.top, left: coords.left }}
        >
          <p className="mb-2 text-sm">{step.content}</p>
          <button
            className="btn text-sm bg-mamastockGold px-2 py-1 rounded"
            onClick={() => setCurrent((c) => c + 1)}
          >
            Suivant
          </button>
        </Motion.div>
      )}
    </AnimatePresence>
  );
}

