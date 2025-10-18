"use client";

import { useEffect } from "react";

export default function PerformanceTracker() {
  useEffect(() => {
    // Track what's happening when long tasks occur
    const recentActivity = [];
    const MAX_ACTIVITY_LOG = 50;

    // Log all significant activity
    const logActivity = (type, details) => {
      recentActivity.push({
        type,
        details,
        timestamp: performance.now(),
      });
      if (recentActivity.length > MAX_ACTIVITY_LOG) {
        recentActivity.shift();
      }
    };

    // Set up long task observer FIRST
    let longTaskObserver;
    try {
      longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const taskTime = entry.startTime;
          const taskEnd = entry.startTime + entry.duration;

          // Find what was happening right before/during this long task
          const relevantActivity = recentActivity.filter(
            (activity) =>
              activity.timestamp >= taskTime - 100 &&
              activity.timestamp <= taskEnd
          );

          // Get scripts that loaded around this time
          const scriptsNearTask = performance
            .getEntriesByType("resource")
            .filter(
              (r) =>
                r.initiatorType === "script" &&
                r.responseEnd >= taskTime - 500 &&
                r.responseEnd <= taskEnd
            )
            .map((s) => ({
              name: s.name.split("/").pop(),
              size: `${(s.transferSize / 1024).toFixed(2)}KB`,
              loadTime: `${s.duration.toFixed(2)}ms`,
            }));

          console.group(
            `🔴 LONG TASK: ${entry.duration.toFixed(
              2
            )}ms @ ${entry.startTime.toFixed(2)}ms`
          );

          if (relevantActivity.length > 0) {
            console.log(
              "Recent Activity Before/During Task:",
              relevantActivity
            );
          }

          if (scriptsNearTask.length > 0) {
            console.log("Scripts Loading Near This Task:", scriptsNearTask);
          }

          // Provide actionable insights
          const insights = [];
          if (scriptsNearTask.length > 0) {
            insights.push(`Heavy script execution: ${scriptsNearTask[0].name}`);
          }
          if (relevantActivity.some((a) => a.type === "fetch")) {
            insights.push("Data fetching/processing");
          }
          if (relevantActivity.some((a) => a.type === "dom-mutation")) {
            insights.push("Heavy DOM manipulation");
          }
          if (taskTime < 2000) {
            insights.push("Initial page hydration");
          }

          if (insights.length > 0) {
            console.log("💡 Potential Causes:", insights);
          }

          console.groupEnd();
        }
      });

      longTaskObserver.observe({ entryTypes: ["longtask"] });
      console.log("✅ Long task observer started");
    } catch (e) {
      console.error("❌ Long task observer failed:", e);
    }

    // Track all fetch requests
    const originalFetch = window.fetch;
    window.fetch = function (...args) {
      const url = args[0].toString();
      const shortUrl = url.slice(0, 50);
      const mark = `fetch-start-${shortUrl}`;

      logActivity("fetch", { url: shortUrl, type: "start" });
      performance.mark(mark);

      return originalFetch.apply(this, args).then((response) => {
        const endMark = `fetch-end-${shortUrl}`;
        performance.mark(endMark);
        performance.measure(`fetch: ${shortUrl}`, mark, endMark);
        performance.getEntriesByType("measure").forEach((m) => {
          if (m.duration > 50) {
            console.log(`🔴 BLOCKER: ${m.name} - ${m.duration.toFixed(2)}ms`);
          }
        });
        logActivity("fetch", { url: shortUrl, type: "complete" });
        return response;
      });
    };

    // Track DOM mutations
    let mutationObserver;
    try {
      mutationObserver = new MutationObserver((mutations) => {
        if (mutations.length > 10) {
          logActivity("dom-mutation", {
            count: mutations.length,
            type: "batch",
          });
        }
      });

      mutationObserver.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
      });
    } catch (e) {
      console.error("❌ Mutation observer failed:", e);
    }

    // Track image loads
    let imageObserver;
    try {
      imageObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.initiatorType === "img" && entry.duration > 100) {
            logActivity("image-load", {
              url: entry.name.split("/").pop(),
              duration: `${entry.duration.toFixed(2)}ms`,
            });
          }
        }
      });

      imageObserver.observe({ entryTypes: ["resource"] });
    } catch (e) {
      console.error("❌ Image observer failed:", e);
    }

    // Track hydration
    logActivity("hydration", "React hydration starting");
    performance.mark("react-hydration-complete");

    const navStart =
      performance.getEntriesByType("navigation")[0]?.startTime || 0;
    performance.measure("time-to-hydration", {
      start: navStart,
      end: performance.now(),
    });

    logActivity("hydration", "React hydration complete");

    console.log("⚡ React Hydration Complete:", {
      time: `${performance.now().toFixed(2)}ms`,
      measure: `${performance
        .getEntriesByName("time-to-hydration")[0]
        ?.duration.toFixed(2)}ms`,
    });

    // Track component render times and other metrics after the page loads
    const handleLoad = () => {
      setTimeout(() => {
        const perfData = performance.getEntriesByType("measure");
        const marks = performance.getEntriesByType("mark");

        console.group("🔍 PERFORMANCE DIAGNOSTICS");

        // Show all custom marks
        console.log(
          "Custom Marks:",
          marks.map((m) => ({
            name: m.name,
            time: `${m.startTime.toFixed(2)}ms`,
          }))
        );

        // Show all custom measures
        console.log(
          "Custom Measures:",
          perfData.map((m) => ({
            name: m.name,
            duration: `${m.duration.toFixed(2)}ms`,
          }))
        );

        // Get all scripts and their load times
        const scripts = performance
          .getEntriesByType("resource")
          .filter((r) => r.initiatorType === "script")
          .sort((a, b) => b.duration - a.duration);

        console.log(
          "Top 10 Slowest Scripts:",
          scripts.slice(0, 10).map((s) => ({
            url: s.name.split("/").pop(),
            duration: `${s.duration.toFixed(2)}ms`,
            size: `${(s.transferSize / 1024).toFixed(2)}KB`,
          }))
        );

        // Get main thread blocking time
        const navigationTiming = performance.getEntriesByType("navigation")[0];
        if (navigationTiming) {
          console.log("Navigation Timing:", {
            domContentLoaded: `${navigationTiming.domContentLoadedEventEnd.toFixed(
              2
            )}ms`,
            loadComplete: `${navigationTiming.loadEventEnd.toFixed(2)}ms`,
            domInteractive: `${navigationTiming.domInteractive.toFixed(2)}ms`,
          });
        }

        console.groupEnd();
      }, 3000);
    };

    window.addEventListener("load", handleLoad);

    // Cleanup
    return () => {
      if (longTaskObserver) longTaskObserver.disconnect();
      if (mutationObserver) mutationObserver.disconnect();
      if (imageObserver) imageObserver.disconnect();
      window.removeEventListener("load", handleLoad);
      window.fetch = originalFetch;
    };
  }, []);

  return null;
}
