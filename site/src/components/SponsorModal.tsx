import React, { useEffect, useRef } from "react";

interface SponsorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SponsorModal({ isOpen, onClose }: SponsorModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-md bg-white border-4 border-black p-6 md:p-8 shadow-neo-lg animate-scaleIn select-none"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 neo-border-sm bg-white hover:bg-neo-pink text-black p-1 shadow-neo-sm neo-btn-hover cursor-pointer"
          aria-label="Close modal"
        >
          <svg
            className="w-5 h-5 stroke-current"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="3"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Title */}
        <div className="flex items-center gap-2 mb-4">
          <span className="neo-border-sm bg-neo-pink px-2.5 py-1 text-sm font-extrabold uppercase shadow-neo-sm transform -rotate-2">
            Support
          </span>
          <h3 className="text-2xl font-black uppercase tracking-tight text-black">
            Sponsor Developer
          </h3>
        </div>

        {/* Main Instruction Box */}
        <div className="neo-border bg-[#fffbeb] p-4 font-bold text-sm leading-relaxed mb-6 text-black">
          <div className="flex items-center gap-2 mb-2 text-neo-pink text-xs font-black uppercase tracking-wider">
            <span>💡</span> Note for Sponsors
          </div>
          Please include your <span className="underline decoration-neo-pink decoration-2 font-black">name</span>, <span className="underline decoration-neo-cyan decoration-2 font-black">email</span>, and <span className="underline decoration-neo-green decoration-2 font-black">project name that you are sponsoring</span> in the <strong className="font-extrabold uppercase bg-neo-yellow px-1 border border-black">notes field</strong> on the payment page.
          <div className="mt-3 text-[11px] text-zinc-650 uppercase font-black tracking-wide border-t border-dashed border-black/20 pt-2">
            This lets me add you to the "My Sponsors" section!
          </div>
        </div>

        {/* CTA Button */}
        <a
          href="https://razorpay.me/@itshivam"
          target="_blank"
          rel="noopener noreferrer"
          onClick={onClose}
          className="neo-border bg-neo-green hover:bg-neo-green/85 text-black font-extrabold text-base uppercase py-3.5 px-6 shadow-neo neo-btn-hover text-center flex items-center justify-center gap-2 w-full transition-all"
        >
          <span>💖</span> Proceed to Sponsor
        </a>

        {/* Cancel Text Link */}
        <button
          onClick={onClose}
          className="mt-4 w-full text-center text-xs font-extrabold uppercase tracking-wider text-zinc-550 hover:text-black hover:underline cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
