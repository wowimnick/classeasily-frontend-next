import { addMinutes, subHours, parseISO } from "date-fns";

export const formatTimeRange = (
  naiveDateStr,
  naiveStartTimeStr,
  durationMinutes,
  businessTimeZoneStr,
  targetDisplayTimeZone
) => {
  if (
    !naiveDateStr ||
    !naiveStartTimeStr ||
    typeof durationMinutes !== "number" ||
    !businessTimeZoneStr ||
    !targetDisplayTimeZone
  ) {
    console.warn("formatTimeRange: Invalid arguments", {
      naiveDateStr,
      naiveStartTimeStr,
      durationMinutes,
      businessTimeZoneStr,
      targetDisplayTimeZone,
    });
    return "Invalid time/duration";
  }
  try {
    const timeParts = naiveStartTimeStr.split(":");
    const formattedTimeStr = `${timeParts[0]}:${timeParts[1] || "00"}:${timeParts[2] || "00"}`;

    // Parse the date and time in the business timezone
    const startDateTime = new Date(`${naiveDateStr}T${formattedTimeStr}`);
    const endDateTime = addMinutes(startDateTime, durationMinutes);

    const startFormatted = startDateTime.toLocaleTimeString("en-US", {
      timeZone: targetDisplayTimeZone,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    const endFormatted = endDateTime.toLocaleTimeString("en-US", {
      timeZone: targetDisplayTimeZone,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    return `${startFormatted} - ${endFormatted}`;
  } catch (error) {
    console.error("Error formatting time range:", error);
    return "Error formatting time";
  }
};

export const getDurationText = (minutes) => {
  if (typeof minutes !== "number" || isNaN(minutes) || minutes <= 0) {
    return "-"; // Return a placeholder if duration is invalid/missing
  }
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours} ${hours === 1 ? "hour" : "hours"}`;
    }
    return `${hours}h ${remainingMinutes}m`;
  }
  return `${minutes} minutes`;
};

// Utility to get total duration for courses
export const getCourseDuration = (startDateStr, endDateStr) => {
  if (!startDateStr || !endDateStr) return "";
  try {
    const start = new Date(startDateStr + "T00:00:00"); // Ensure consistent parsing
    const end = new Date(endDateStr + "T00:00:00"); // Ensure consistent parsing
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return "";
    }
    // Manual calculation might be clearer for "X weeks"
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Inclusive days
    const diffWeeks = Math.ceil(diffDays / 7);
    // Handle edge case of less than a week
    if (diffWeeks < 1) return "Less than a week";
    if (diffWeeks === 1) return "1 week";
    return `${diffWeeks} weeks`;
  } catch (error) {
    console.error("Error calculating course duration:", error);
    return "";
  }
};

export const getScheduleSummary = (schedules) => {
  // Added more robust check for schedules array
  if (!schedules || !Array.isArray(schedules) || schedules.length === 0) {
    console.warn("getScheduleSummary: No schedules provided or not an array.");
    return null;
  }

  // Filter out potentially invalid schedule objects and ensure isActive is handled
  // Assume active if is_active is undefined or true
  const activeSchedules = schedules.filter(
    (s) => s && (s.is_active === undefined || s.is_active === true)
  );

  if (activeSchedules.length === 0) {
    console.warn("getScheduleSummary: No active schedules found.");
    return null; // Explicitly return null if no active schedules
  }

  // Get unique durations, filtering non-numeric values
  const durations = [
    ...new Set(
      activeSchedules
        .map((s) => s.duration)
        .filter((d) => typeof d === "number" && !isNaN(d))
    ),
  ];

  // Get price range, filtering non-numeric values AND prices > 0
  const prices = activeSchedules
    .map((s) => parseFloat(s.price))
    .filter((p) => typeof p === "number" && !isNaN(p) && p > 0);
  const minPrice = prices.length > 0 ? Math.min(...prices) : null;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : null;

  // Get capacity range, filtering non-numeric values
  const capacities = activeSchedules
    .map((s) => s.maxParticipants)
    .filter((c) => typeof c === "number" && !isNaN(c));
  const minCapacity = capacities.length > 0 ? Math.min(...capacities) : null;
  const maxCapacity = capacities.length > 0 ? Math.max(...capacities) : null;

  // If no valid price found, return price as '-'
  const priceString =
    minPrice === null
      ? "-"
      : minPrice === maxPrice
        ? `$${minPrice.toFixed(2)}`
        : `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`;

  // If no valid duration found, return duration as '-'
  const durationString =
    durations.length === 0
      ? "-"
      : durations.length === 1
        ? getDurationText(durations[0])
        : `${getDurationText(Math.min(...durations))} - ${getDurationText(Math.max(...durations))}`;

  // If no valid capacity found, return capacity as '-'
  const capacityString =
    minCapacity === null
      ? "-"
      : minCapacity === maxCapacity
        ? minCapacity.toString() // Convert number to string
        : `${minCapacity} - ${maxCapacity}`;

  const minParticipants = activeSchedules
    .map((s) => s.minParticipants)
    .filter((c) => typeof c === "number" && !isNaN(c) && c > 1);
  const minMinParticipants =
    minParticipants.length > 0 ? Math.min(...minParticipants) : null;
  const maxMinParticipants =
    minParticipants.length > 0 ? Math.max(...minParticipants) : null;

  const minParticipantsString =
    minMinParticipants === null
      ? null
      : minMinParticipants === maxMinParticipants
        ? `Min ${minMinParticipants} people`
        : `Min ${minMinParticipants}-${maxMinParticipants} people`;

  return {
    duration: durationString,
    price: priceString,
    capacity: capacityString,
    minParticipants: minParticipantsString, // ADDED
  };
};

// Generates a string like "Mon 10:00 AM, Wed 6:00 PM"
export const getGeneralScheduleInfo = (schedules) => {
  if (!schedules || !Array.isArray(schedules) || schedules.length === 0) {
    return "No schedule info available.";
  }

  const activeSchedules = schedules.filter(
    (s) =>
      s &&
      (s.is_active === undefined || s.is_active === true) &&
      s.day &&
      s.time
  );

  if (activeSchedules.length === 0) {
    return "No active schedule info.";
  }

  // Sort by day of week (assuming 'Mon', 'Tue', etc.) then time
  const dayOrder = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
  activeSchedules.sort((a, b) => {
    const dayDiff = (dayOrder[a.day] || 8) - (dayOrder[b.day] || 8);
    if (dayDiff !== 0) return dayDiff;
    // If days are the same, sort by time
    return (a.time || "").localeCompare(b.time || "");
  });

  // Group by day
  const schedulesByDay = activeSchedules.reduce((acc, s) => {
    if (!acc[s.day]) {
      acc[s.day] = [];
    }
    // Format time and add if not already present for that day
    try {
      const formattedTime = new Date(`1970-01-01T${s.time}`).toLocaleTimeString(
        [],
        { hour: "numeric", minute: "2-digit", hour12: true }
      );
      if (!acc[s.day].includes(formattedTime)) {
        acc[s.day].push(formattedTime);
      }
    } catch (e) {
      console.warn("Could not format time:", s.time);
    }
    return acc;
  }, {});

  // Create strings like "Mon 10:00 AM, 1:00 PM"
  const dayStrings = Object.entries(schedulesByDay).map(([day, times]) => {
    return `${day} ${times.join(", ")}`;
  });

  // Join the day strings, limit length if needed
  let scheduleText = dayStrings.join(" | ");
  if (scheduleText.length > 60) {
    // Limit length for display
    scheduleText = scheduleText.substring(0, 57) + "...";
  }

  return scheduleText || "Schedule info unavailable."; // Fallback
};

export const getCancellationPolicyText = (
  policyKey,
  percentage,
  customHours,
  classStartDateTime = null, // ISO string: "2025-01-15T19:00:00"
  userTimeZone = null,
  businessTimeZone = null // Added businessTimeZone parameter
) => {
  console.log(
    policyKey,
    percentage,
    customHours,
    classStartDateTime,
    userTimeZone,
    businessTimeZone
  );
  if (policyKey === null || policyKey === undefined) {
    return "No cancellation information available.";
  }

  // Determine the refund description based on the percentage from the database
  const refundText =
    percentage === 100
      ? "a full refund"
      : percentage > 0
        ? `a ${percentage}% refund`
        : "no refund";

  // If we have class start time, calculate the specific deadline
  const getDeadlineText = (hoursBeforeStart) => {
    if (!classStartDateTime || !userTimeZone) {
      console.log("Missing classStartDateTime or userTimeZone:", {
        classStartDateTime,
        userTimeZone,
      });
      return `at least ${formatHoursForDisplay(hoursBeforeStart)} before the class starts`;
    }

    try {
      // Parse the class start time - assume it's in business timezone if provided
      let classStart = new Date(classStartDateTime);

      // If the parsed date is invalid, try parseISO
      if (isNaN(classStart.getTime())) {
        classStart = parseISO(classStartDateTime);
      }

      const deadline = subHours(classStart, hoursBeforeStart);

      const deadlineFormatted = deadline.toLocaleString("en-US", {
        timeZone: userTimeZone,
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZoneName: "short",
      });

      console.log("Calculated deadline:", deadlineFormatted);
      return `before ${deadlineFormatted}`;
    } catch (error) {
      console.error("Error calculating cancellation deadline:", error);
      return `at least ${formatHoursForDisplay(hoursBeforeStart)} before the class starts`;
    }
  };

  switch (policyKey) {
    case "flexible":
      return `Flexible: This class offers ${refundText} if you cancel ${getDeadlineText(1)}.`;
    case "24h":
      return `24-Hour Policy: You will receive ${refundText} if you cancel ${getDeadlineText(24)}.`;
    case "48h":
      return `48-Hour Policy: You will receive ${refundText} if you cancel ${getDeadlineText(48)}.`;
    case "72h":
      return `72-Hour Policy: You will receive ${refundText} if you cancel ${getDeadlineText(72)}.`;
    case "custom": {
      if (!customHours || customHours <= 0) {
        return `A standard cancellation policy applies. Please check details before booking.`;
      }
      return `You will receive ${refundText} if you cancel ${getDeadlineText(customHours)}.`;
    }
    case "strict":
      return "Strict Policy: This booking is non-refundable once purchased.";
    default:
      return "A standard cancellation policy applies. Please check the details before booking.";
  }
};

export const formatHoursForDisplay = (hours) => {
  if (typeof hours !== "number" || isNaN(hours) || hours <= 0) {
    return "";
  }

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;

  if (remainingHours === 0) {
    return `${days} ${days === 1 ? "day" : "days"}`;
  }

  if (days === 0) {
    return `${remainingHours} ${remainingHours === 1 ? "hour" : "hours"}`;
  }

  return `${days} ${days === 1 ? "day" : "days"} and ${remainingHours} ${
    remainingHours === 1 ? "hour" : "hours"
  }`;
};
