"use client";

import { useEffect, useState } from "react";

export function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let animationFrame = 0;

    function handleScroll() {
      if (animationFrame) {
        return;
      }

      animationFrame = window.requestAnimationFrame(() => {
        setIsVisible(window.scrollY > 500);
        animationFrame = 0;
      });
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
      }

      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  function handleClick() {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }

  return (
    <button
      type="button"
      className={`back-to-top ${isVisible ? "is-visible" : ""}`}
      aria-label="Về đầu trang"
      aria-hidden={!isVisible}
      tabIndex={isVisible ? 0 : -1}
      onClick={handleClick}
    >
      <span aria-hidden="true">↑</span>
    </button>
  );
}
