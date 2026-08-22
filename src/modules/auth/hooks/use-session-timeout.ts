"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { clearSession, isLoggedIn } from "@/common/lib/auth";

const TIMEOUT_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds
const CHECK_INTERVAL = 10000; // Check every 10 seconds
const LAST_ACTIVITY_KEY = "simpa_last_activity";

export function useSessionTimeout() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;

    // If the user is not logged in, we don't need to run the timeout check.
    if (!isLoggedIn()) return;

    // Initialize last activity timestamp if it doesn't exist
    if (!localStorage.getItem(LAST_ACTIVITY_KEY)) {
      localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
    }

    let lastWriteTime = Date.now();

    const updateActivity = () => {
      const now = Date.now();
      // Throttle writes to localStorage to once every 5 seconds
      if (now - lastWriteTime > 5000) {
        localStorage.setItem(LAST_ACTIVITY_KEY, now.toString());
        lastWriteTime = now;
      }
    };

    const handleTimeoutCheck = () => {
      if (!isLoggedIn()) return;

      const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);
      if (lastActivity) {
        const timeElapsed = Date.now() - parseInt(lastActivity, 10);
        if (timeElapsed >= TIMEOUT_DURATION) {
          console.log("[Session Timeout] User inactive for 30 minutes. Logging out.");
          clearSession();
          router.replace("/login");
        }
      }
    };

    // Listen for storage changes to sync logout across tabs
    const handleStorageChange = (e: StorageEvent) => {
      // If simpa_session is cleared in another tab, log out here too
      if (e.key === "simpa_session" && !e.newValue) {
        console.log("[Session Timeout] Session cleared in another tab. Redirecting to login.");
        router.replace("/login");
      }
    };

    // User interaction events to monitor
    const activityEvents = [
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "mousemove",
    ];

    // Register event listeners
    activityEvents.forEach((event) => {
      window.addEventListener(event, updateActivity);
    });

    window.addEventListener("storage", handleStorageChange);

    // Setup checking interval
    const intervalId = setInterval(handleTimeoutCheck, CHECK_INTERVAL);

    // Run an initial check immediately
    handleTimeoutCheck();

    return () => {
      // Clean up event listeners and interval
      activityEvents.forEach((event) => {
        window.removeEventListener(event, updateActivity);
      });
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(intervalId);
    };
  }, [router]);
}
