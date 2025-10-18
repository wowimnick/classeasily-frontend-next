// src/services/utils.js OR src/utils/dateTimeUtils.js

import { formatInTimeZone, fromZonedTime, toZonedTime, format as formatWithTZ } from 'date-fns-tz';
import { addMinutes, format as dateFnsFormat, parseISO, parse as dateFnsParse, isValid as isDateValid } from 'date-fns'; // Added parse, isValid

/**
 * @param {string} utcIsoString - e.g., "2023-10-27T14:00:00Z"
 * @param {string} targetDisplayTimeZone - e.g., "America/New_York". If null/undefined, defaults to UTC.
 * @param {object} formatOptions - { dateTimeFormat: "PP p", dateFormat: "PP", timeFormat: "p" }
 */
export const formatUTCToUserDisplay = (utcIsoString, targetDisplayTimeZone, formatOptions = {}) => {
  if (!utcIsoString) return "Invalid Date";
  const effectiveDisplayTimeZone = targetDisplayTimeZone || 'Etc/UTC';
  try {
    const utcDate = parseISO(utcIsoString);
    if (!isDateValid(utcDate)) throw new Error("Invalid ISO string parsed");
    const displayFormat = formatOptions.dateTimeFormat || "PP p (zzz)"; 
    return formatInTimeZone(utcDate, effectiveDisplayTimeZone, displayFormat);
  } catch (error) {
    console.error("Error in formatUTCToUserDisplay:", error, { utcIsoString, targetDisplayTimeZone });
    return "Invalid Date";
  }
};

/**
 * @param {string} naiveDateStr - e.g., "2024-07-15"
 * @param {string} naiveTimeStr - e.g., "10:00:00" or "10:00"
 * @param {string} businessTimeZoneStr - e.g., "America/New_York". If null/undefined, assumes naive time is effectively UTC.
 * @param {string} targetDisplayTimeZone - e.g., "Europe/London". If null/undefined, defaults to UTC.
 * @param {object} formatOptions - { dateTimeFormat: "PP p", dateFormat: "PP", timeFormat: "p" }
 */
export const formatBusinessLocalToUserDisplay = (naiveDateStr, naiveTimeStr, businessTimeZoneStr, targetDisplayTimeZone, formatOptions = {}) => {
  console.log('formatBusinessLocalToUserDisplay called with:', {
    naiveDateStr,
    naiveTimeStr, 
    businessTimeZoneStr,
    targetDisplayTimeZone,
    formatOptions
  });

  if (!naiveDateStr || !naiveTimeStr) {
    console.log('Early return: missing date or time');
    return "Invalid Time";
  }

  const effectiveBusinessTimeZone = businessTimeZoneStr || 'Etc/UTC';
  const effectiveDisplayTimeZone = targetDisplayTimeZone || 'Etc/UTC';

  console.log('Effective timezones:', {
    effectiveBusinessTimeZone,
    effectiveDisplayTimeZone
  });

  try {
    const timeParts = naiveTimeStr.split(':');
    console.log('Time parts:', timeParts);
    
    const formattedTimeStr = `${timeParts[0]}:${timeParts[1] || '00'}:${timeParts[2] || '00'}`;
    console.log('Formatted time string:', formattedTimeStr);
    
    const dateTimeInBusinessTZStr = `${naiveDateStr}T${formattedTimeStr}`;
    console.log('DateTime string for business TZ:', dateTimeInBusinessTZStr);

    const utcDate = fromZonedTime(dateTimeInBusinessTZStr, effectiveBusinessTimeZone);
    console.log('UTC date from fromZonedTime:', utcDate);
    console.log('UTC date is valid:', isDateValid(utcDate));
    
    if (!isDateValid(utcDate)) {
      console.error('Invalid UTC date derived');
      throw new Error("Could not derive valid UTC date from zoned time");
    }

    const displayFormat = formatOptions.dateTimeFormat || "PP p (zzz)";
    console.log('Display format:', displayFormat);
    
    const result = formatInTimeZone(utcDate, effectiveDisplayTimeZone, displayFormat);
    console.log('Final formatted result:', result);
    
    return result;
  } catch (error) {
    console.error('Error in formatBusinessLocalToUserDisplay:', error);
    console.error('Full error details:', {
      message: error.message,
      stack: error.stack,
      inputs: { naiveDateStr, naiveTimeStr, businessTimeZoneStr, targetDisplayTimeZone }
    });
    throw error; 
  }
};

/**
 * Formats a naive date string (YYYY-MM-DD) into a more readable format.
 * This version parses the naive string as a local date and formats its local parts.
 * @param {string} naiveDateStr - e.g., "2024-07-15"
 * @param {string} [outputFormat="MMM d, yyyy"] - Desired output format.
 */
export const formatNaiveDate = (naiveDateStr, outputFormat = "MMM d, yyyy") => {
  if (!naiveDateStr) return "Invalid Date";
  try {
    const date = dateFnsParse(naiveDateStr, 'yyyy-MM-dd', new Date());
    if (!isDateValid(date)) {
        console.error("formatNaiveDate: Failed to parse naiveDateStr:", naiveDateStr);
        return "Invalid Date";
    }
    return dateFnsFormat(date, outputFormat);
  } catch (error) {
    console.error("Error formatting naive date:", error, { naiveDateStr });
    return "Invalid Date";
  }
};


/**
 * Formats a naive time string (HH:mm:ss or HH:mm) into a more readable format.
 * @param {string} naiveTimeStr - e.g., "10:00:00" or "10:00"
 * @param {string} [outputFormat="p"] - Desired output format (date-fns 'p' is short time).
 */
export const formatNaiveTime = (naiveTimeStr, outputFormat = "p") => { 
  if (!naiveTimeStr) return "Invalid Time";
  try {
    const timeParts = naiveTimeStr.split(':');
    const hours = parseInt(timeParts[0], 10);
    const minutes = parseInt(timeParts[1] || '0', 10);
    const seconds = parseInt(timeParts[2] || '0', 10);
    if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) return "Invalid Time";

    const baseDate = new Date(1970, 0, 1, hours, minutes, seconds);
    if(!isDateValid(baseDate)) throw new Error("Could not create valid base date for time formatting");

    return dateFnsFormat(baseDate, outputFormat);
  } catch (error) {
    console.error("Error formatting naive time:", error, { naiveTimeStr });
    return "Invalid Time";
  }
};

/**
 * Formats a time range for display in the target timezone.
 * @param {string} naiveDateStr - Naive date of the event, e.g., "2024-07-15"
 * @param {string} naiveStartTimeStr - Naive start time, e.g., "10:00:00"
 * @param {number} durationMinutes - Duration in minutes
 * @param {string} businessTimeZoneStr - IANA timezone of the business
 * @param {string} targetDisplayTimeZone - IANA timezone for display to the user
 * @returns {string} Formatted time range string or error message.
 */
export const formatTimeRangeForDisplay = (naiveDateStr, naiveStartTimeStr, durationMinutes, businessTimeZoneStr, targetDisplayTimeZone) => {
  if (!naiveDateStr || !naiveStartTimeStr || typeof durationMinutes !== 'number' || !businessTimeZoneStr || !targetDisplayTimeZone) {
    console.warn("formatTimeRangeForDisplay: Invalid arguments", { naiveDateStr, naiveStartTimeStr, durationMinutes, businessTimeZoneStr, targetDisplayTimeZone });
    return 'Invalid time/duration';
  }
  try {
    const timeParts = naiveStartTimeStr.split(':');
    const formattedStartTimeStr = `${timeParts[0]}:${timeParts[1] || '00'}:${timeParts[2] || '00'}`;
    const startDateTimeInBusinessLocalStr = `${naiveDateStr}T${formattedStartTimeStr}`;

    const startDateUtc = fromZonedTime(startDateTimeInBusinessLocalStr, businessTimeZoneStr);
    if (!isDateValid(startDateUtc)) throw new Error("Could not derive valid UTC start date from zoned time");
    const endDateUtc = addMinutes(startDateUtc, durationMinutes);
    if (!isDateValid(endDateUtc)) throw new Error("Could not derive valid UTC end date");

    // Use 'a' for AM/PM
    const startFormatted = formatInTimeZone(startDateUtc, targetDisplayTimeZone, 'h:mm a'); 
    const endFormatted = formatInTimeZone(endDateUtc, targetDisplayTimeZone, 'h:mm a');

    return `${startFormatted} - ${endFormatted}`;
  } catch (error) {
    throw error;
  }
};


/**
 * Gets a naive date string in "yyyy-MM-dd" format from a JS Date or picker value.
 * This specifically formats the *local* date parts of the JS Date object.
 * @param {Date|number|string} jsDateOrPickerValue - Input date.
 * @returns {string|null} Formatted date string or null on error.
 */
export const getNaiveDateForAPI = (jsDateOrPickerValue) => {
  if (!jsDateOrPickerValue) return null;
  try {
    const date = new Date(jsDateOrPickerValue);
    if (!isDateValid(date)) throw new Error("Invalid date value for getNaiveDateForAPI");
    return dateFnsFormat(date, 'yyyy-MM-dd');
  } catch (error) {
    console.error("Error in getNaiveDateForAPI:", error);
    return null;
  }
};

/**
 * Gets a naive time string in "HH:mm:ss" format from a JS Date or picker value.
 * This specifically formats the *local* time parts of the JS Date object.
 * @param {Date|number|string} jsDateOrPickerValue - Input date/time.
 * @returns {string|null} Formatted time string or null on error.
 */
export const getNaiveTimeForAPI = (jsDateOrPickerValue) => {
  if (!jsDateOrPickerValue) return null;
  try {
    const date = new Date(jsDateOrPickerValue);
     if (!isDateValid(date)) throw new Error("Invalid date value for getNaiveTimeForAPI");
    return dateFnsFormat(date, 'HH:mm:ss');
  } catch (error) {
    console.error("Error in getNaiveTimeForAPI:", error);
    return null;
  }
};

/**
 * Helper to get 'yyyy-MM-dd' string from a JS Date object, based on its local date parts.
 * @param {Date} jsDate - The JavaScript Date object.
 * @returns {string|null} Formatted date string or null if invalid.
 */
export const getLocalYYYYMMDD = (jsDate) => {
  if (!jsDate || !(jsDate instanceof Date) || !isDateValid(jsDate)) {
    return null;
  }
  return dateFnsFormat(jsDate, 'yyyy-MM-dd');
};

import { parsePhoneNumberFromString } from 'libphonenumber-js';

/**
 * Formats a phone number string into a user-friendly display format and a clickable link.
 * @param {string} phoneString - The raw phone number, preferably in E.164 format (e.g., "+19046510798").
 * @returns {{display: string, link: string | null}} - An object with the display string and a tel: link.
 */
export const formatPhoneNumber = (phoneString, defaultCountry = 'CA') => {
  if (!phoneString || typeof phoneString !== 'string' || !phoneString.trim()) {
    return { display: "Not Provided", link: null };
  }
  try {
    // CRITICAL FIX: Pass the defaultCountry to the parser.
    const phoneNumber = parsePhoneNumberFromString(phoneString, defaultCountry);
    
    if (phoneNumber && phoneNumber.isValid()) {
      return {
        display: phoneNumber.formatNational(), // e.g., (904) 651-0798
        link: phoneNumber.getURI(), // e.g., tel:+19046510798
      };
    }
  } catch (error) {
    console.warn(`Could not parse phone number: ${phoneString}`, error);
  }
  // Fallback for numbers that still can't be parsed or are invalid
  return { display: phoneString, link: `tel:${phoneString.replace(/\D/g, '')}` };
};