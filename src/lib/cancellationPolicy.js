import { subHours, parseISO, isValid } from "date-fns";
import { fromZonedTime } from "date-fns-tz";

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

export const getCancellationPolicyText = (
  policyKey,
  percentage,
  customHours,
  classStartDateTime = null,
  userTimeZone = null,
  businessTimeZone = null,
) => {
  if (policyKey === null || policyKey === undefined) {
    return "No cancellation information available.";
  }

  const refundText =
    percentage === 100
      ? "a full refund"
      : percentage > 0
        ? `a ${percentage}% refund`
        : "no refund";

  const getDeadlineText = (hoursBeforeStart) => {
    if (!classStartDateTime || !userTimeZone) {
      return `at least ${formatHoursForDisplay(hoursBeforeStart)} before the class starts`;
    }

    try {
      let classStartUtc;
      if (businessTimeZone) {
        classStartUtc = fromZonedTime(classStartDateTime, businessTimeZone);
      } else {
        classStartUtc = parseISO(classStartDateTime);
        if (!isValid(classStartUtc)) {
          classStartUtc = new Date(classStartDateTime);
        }
      }
      if (!isValid(classStartUtc) || isNaN(classStartUtc.getTime())) {
        return `at least ${formatHoursForDisplay(hoursBeforeStart)} before the class starts`;
      }

      const deadline = subHours(classStartUtc, hoursBeforeStart);

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
