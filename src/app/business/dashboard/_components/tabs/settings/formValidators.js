// src/components/businessDashboard/settings/formValidators.js
import { parsePhoneNumberFromString } from "libphonenumber-js/max"; // Use 'max' for full validation metadata

/**
 * Normalizes a URL by adding 'https://' if no protocol is present.
 * @param {string} url The input URL string.
 * @returns {string} The normalized URL.
 */
export const normalizeUrl = (url) => {
  if (!url || typeof url !== "string") return url;
  const trimmedUrl = url.trim();
  if (!trimmedUrl || trimmedUrl.match(/^(https?|ftp):\/\//i)) {
    return trimmedUrl;
  }
  return `https://${trimmedUrl}`;
};

/**
 * Ant Design form validator for a generic URL.
 * @param {object} _ The rule object (unused).
 * @param {string} value The input value.
 * @returns {Promise<void>} A promise that resolves if valid, or rejects if invalid.
 */
export const validateUrl = (_, value) => {
  if (!value || !value.trim()) {
    return Promise.resolve(); // Optional field is valid if empty
  }
  try {
    new URL(normalizeUrl(value));
    return Promise.resolve();
  } catch (error) {
    return Promise.reject(
      new Error("Please enter a valid URL (e.g., example.com)")
    );
  }
};

/**
 * Creates an Ant Design form validator for social media URLs, checking the domain.
 * @param {('facebook'|'instagram'|'twitter'|'linkedin')} platform The social media platform to validate against.
 * @returns {function(_, string): Promise<void>} A validator function.
 */
export const validateSocialUrl = (platform) => (_, value) => {
  if (!value || !value.trim()) {
    return Promise.resolve(); // Optional field is valid if empty
  }
  const platformDomains = {
    facebook: ["facebook.com", "www.facebook.com", "fb.com", "www.fb.com"],
    instagram: ["instagram.com", "www.instagram.com"],
    twitter: ["twitter.com", "www.twitter.com", "x.com", "www.x.com"],
    linkedin: ["linkedin.com", "www.linkedin.com"],
  };

  try {
    const url = new URL(normalizeUrl(value));
    const hostname = url.hostname.toLowerCase();

    if (
      platformDomains[platform] &&
      !platformDomains[platform].includes(hostname)
    ) {
      return Promise.reject(new Error(`Please enter a valid ${platform} URL.`));
    }
    return Promise.resolve();
  } catch (error) {
    return Promise.reject(new Error("Please enter a valid URL."));
  }
};

/**
 * Ant Design form validator for a phone number.
 * @param {string} countryCode The default country code to validate against (e.g., 'CA', 'US').
 * @returns {function(_, string): Promise<void>} A validator function.
 */
export const validatePhoneNumber =
  (countryCode = "CA") =>
  (_, value) => {
    if (!value || !value.trim()) {
      return Promise.resolve(); // Optional field is valid if empty
    }
    try {
      const phoneNumber = parsePhoneNumberFromString(value, countryCode);
      if (phoneNumber && phoneNumber.isValid()) {
        return Promise.resolve();
      }
      return Promise.reject(new Error("Please enter a valid phone number."));
    } catch (error) {
      return Promise.reject(new Error("Please enter a valid phone number."));
    }
  };