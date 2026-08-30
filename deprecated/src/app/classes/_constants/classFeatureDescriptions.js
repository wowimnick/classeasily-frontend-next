/**
 * Guest-facing blurbs for preset class features (Things to know).
 * Keys are lowercase, trimmed — match ClassOffers featureIcons / dashboard presets.
 * Custom host-entered tags have no entry here.
 */
export const CLASS_FEATURE_DESCRIPTIONS = {
  // Current presets (business dashboard)
  "all supplies included":
    "Materials and tools for the session are provided.",
  "beginner friendly": "No prior skills expected—great for first-timers.",
  "drinks included":
    "Drinks included when the host marks them as part of the experience.",
  "food included":
    "Food or snacks included when the host marks them as part of the experience.",
  "take-home creation": "You'll leave with something you made in class.",
  "small group": "Keeps the roster smaller for a more personal session.",
  "private group available":
    "Ask the host about booking the whole experience just for your group.",
  "date night": "Well suited for couples or a night out together.",
  "family friendly":
    "Welcoming for families; supervision or age notes may apply.",
  "great for teams": "Works well for coworkers, offsites, or group outings.",
  "free parking":
    "Complimentary or included parking on site or nearby, per host.",
  indoor: "This experience takes place indoors.",
  outdoor: "This experience takes place outdoors.",
  "wheelchair accessible":
    "Accessible routes available—confirm specifics with your host.",

  // Legacy / admin presets (same ideas, older wording)
  "all materials provided":
    "Materials and tools for the session are provided.",
  "hands-on experience":
    "You'll participate hands-on—not a demo-only session.",
  "no experience necessary":
    "No prior skills expected—great for first-timers.",
  "personalized feedback": "Instructor feedback tailored to how you're doing.",
  "certificate of completion": "A completion certificate when you finish.",
  "suitable for all levels": "Beginners and seasoned guests alike.",
  "date night special": "Well suited for couples or a night out together.",
  "great for team-building":
    "Works well for coworkers, offsites, or group outings.",
  "family-friendly (all ages)":
    "Welcoming for families; supervision or age notes may apply.",
  "intimate class setting": "Smaller class size for more individual attention.",
  "free on-site parking":
    "Complimentary or included parking on site or nearby, per host.",
  "refreshments included": "Light refreshments included with the session.",
  "flexible booking": "Easier changes or rescheduling where the host allows.",
  "in-class materials for purchase":
    "Optional supplies or items available to buy during class.",
  "wear comfortable clothes": "Dress for movement or mess, per activity.",
  "bilingual instructor":
    "Instruction offered in more than one language when noted.",
};

/**
 * @param {string} normalizedKey lowercase trimmed feature label
 * @returns {string}
 */
export function getClassFeatureDescription(normalizedKey) {
  if (!normalizedKey || normalizedKey === "unknown") return "";
  return CLASS_FEATURE_DESCRIPTIONS[normalizedKey] ?? "";
}
