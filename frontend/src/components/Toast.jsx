import { useEffect, useState } from "react";

export default function Toast({ message, show, onClose }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      // Trigger animation after a brief delay to ensure smooth fade-in
      const fadeInTimer = setTimeout(() => setIsVisible(true), 10);
      
      // Auto-dismiss after 3 seconds
      const dismissTimer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => {
          onClose();
        }, 300); // Wait for fade-out animation to complete
      }, 3000);

      return () => {
        clearTimeout(fadeInTimer);
        clearTimeout(dismissTimer);
      };
    } else {
      setIsVisible(false);
    }
  }, [show]); // Remove onClose from dependencies to avoid re-renders

  if (!show) return null;

  return (
    <div
      className={`fixed top-4 right-4 z-50 transition-all duration-300 ease-in-out ${
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 -translate-y-2"
      }`}
    >
      <div className="rounded-lg bg-emerald-600 text-white px-4 py-3 shadow-lg border border-emerald-700 min-w-[200px]">
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <p className="text-sm font-medium">{message}</p>
        </div>
      </div>
    </div>
  );
}

