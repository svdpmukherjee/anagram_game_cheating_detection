import { useEffect, useRef, useCallback } from "react";

const EventTrack = ({
  onPageLeave,
  onPageReturn,
  onInactivityStart,
  onActiveReturn,
  enabled = true,
  inactivityTimeout = 5000,
  maxTabChanges = Infinity,
}) => {
  const lastActivity = useRef(Date.now());
  const isInactive = useRef(false);
  const pageState = useRef("active");
  const tabChangeCount = useRef(0);
  const lastTabChangeTime = useRef(Date.now());
  const inactivityTimer = useRef(null);
  const lastEventTime = useRef(0);
  const isEnabled = useRef(enabled);

  const EVENT_THRESHOLD = 300;
  const TAB_CHANGE_RESET_TIME = 10000;

  const shouldProcessEvent = useCallback(() => {
    const now = Date.now();
    if (now - lastEventTime.current > EVENT_THRESHOLD) {
      lastEventTime.current = now;
      return true;
    }
    return false;
  }, []);

  const checkInactivity = useCallback(() => {
    const now = Date.now();
    const timeSinceLastActivity = now - lastActivity.current;

    if (
      !isInactive.current &&
      timeSinceLastActivity >= inactivityTimeout &&
      isEnabled.current
    ) {
      isInactive.current = true;
      onInactivityStart?.();
    }
  }, [inactivityTimeout, onInactivityStart]);

  const resetInactivityTimer = useCallback(() => {
    if (!isEnabled.current) return;

    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }

    const now = Date.now();
    lastActivity.current = now;

    if (isInactive.current) {
      isInactive.current = false;
      onActiveReturn?.();
    }

    inactivityTimer.current = setTimeout(checkInactivity, inactivityTimeout);
  }, [inactivityTimeout, onActiveReturn, checkInactivity]);

  const handleActivity = useCallback(
    (e) => {
      if (document.hidden || !isEnabled.current) return;

      lastActivity.current = Date.now();

      if (isInactive.current) {
        isInactive.current = false;
        onActiveReturn?.();
      }
    },
    [onActiveReturn]
  );

  const handleVisibilityState = useCallback(() => {
    if (!shouldProcessEvent() || !isEnabled.current) return;

    const now = Date.now();
    const isPageHidden = document.hidden;

    if (now - lastTabChangeTime.current > TAB_CHANGE_RESET_TIME) {
      tabChangeCount.current = 0;
    }

    if (isPageHidden && pageState.current === "active") {
      tabChangeCount.current++;
      lastTabChangeTime.current = now;
      pageState.current = "inactive";
      onPageLeave?.({
        tabChangeCount: tabChangeCount.current,
        timestamp: now,
      });
    } else if (!isPageHidden && pageState.current === "inactive") {
      pageState.current = "active";
      onPageReturn?.();
      resetInactivityTimer();
    }
  }, [onPageLeave, onPageReturn, resetInactivityTimer, shouldProcessEvent]);

  const handleFocus = useCallback(() => {
    if (
      pageState.current === "inactive" &&
      !document.hidden &&
      shouldProcessEvent() &&
      isEnabled.current
    ) {
      pageState.current = "active";
      onPageReturn?.();
      resetInactivityTimer();
    }
  }, [onPageReturn, resetInactivityTimer, shouldProcessEvent]);

  const handleBlur = useCallback(() => {
    if (
      pageState.current === "active" &&
      shouldProcessEvent() &&
      isEnabled.current
    ) {
      pageState.current = "inactive";
      onPageLeave?.();
    }
  }, [onPageLeave, shouldProcessEvent]);

  // Track enabled state changes
  useEffect(() => {
    isEnabled.current = enabled;
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    // Set up initial inactivity timer
    // resetInactivityTimer();

    // Regular activity checking interval
    const checkInterval = setInterval(() => {
      checkInactivity();
    }, 1000);

    // Document-level event listeners
    document.addEventListener("visibilitychange", handleVisibilityState);

    // Window-level event listeners for alt+tab and window focus
    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);

    // Activity tracking events
    const activityEvents = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
      "click",
    ];

    activityEvents.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Set up interval to check inactivity regularly
    const inactivityCheckInterval = setInterval(checkInactivity, 1000);

    return () => {
      console.log("Cleaning up event listeners"); // Debug log
      clearInterval(checkInterval);
      activityEvents.forEach((event) => {
        document.removeEventListener(event, handleActivity, true);
      });
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }
      clearInterval(inactivityCheckInterval);

      document.removeEventListener("visibilitychange", handleVisibilityState);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);

      activityEvents.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [
    enabled,
    handleActivity,
    handleVisibilityState,
    handleFocus,
    handleBlur,
    resetInactivityTimer,
    checkInactivity,
  ]);

  return null;
};

export default EventTrack;
