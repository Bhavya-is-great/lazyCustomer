"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { createProtectedStorage } from "@/utils/protectedStorage";

/**
 * NoLoaderLink
 * Props:
 * - href (string)   required
 * - secretKey (string) required → must match Loader’s secretKey
 * - replace (bool)  optional
 * - className, children, ...rest → forwarded to <a>
 *
 * Example:
 * <NoLoaderLink href="/shop" secretKey={uiSecret}>Shop</NoLoaderLink>
 */
export default function Teleport({
  href,
  secretKey,
  replace = false,
  children,
  className,
  ...rest
}) {
  const router = useRouter();

  // get protected helpers
  const { protectedSet } = createProtectedStorage(secretKey);

  const handleClick = async (e) => {
    // allow default behavior for new tab / modifiers
    if (
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey ||
      (e.nativeEvent && e.nativeEvent.which === 2)
    ) {
      return;
    }

    e.preventDefault();

    // --- Protected flags so Loader skips ---
    try {
      protectedSet("loaderPlayed", true);       // skip animation for SPA nav
      protectedSet("skipLoaderOnReload", true); // skip animation on reload
    } catch (e) {}

    // transient global → skip loader immediately
    if (typeof window !== "undefined") {
      window.__skipLoaderNext = true;
      setTimeout(() => {
        try {
          delete window.__skipLoaderNext;
        } catch (_) {}
      }, 1000);
    }

    // --- Navigation ---
    try {
      if (replace) {
        await router.replace(href);
      } else {
        await router.push(href);
      }
    } catch (err) {
      // fallback if router fails (rare)
      if (typeof window !== "undefined") window.location.href = href;
    }
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      className={className}
      {...rest}
    >
      {children}
    </a>
  );
}
