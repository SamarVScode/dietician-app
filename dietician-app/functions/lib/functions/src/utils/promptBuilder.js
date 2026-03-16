"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildDietPlanPrompt = void 0;
const buildDietPlanPrompt = (user) => {
    const { name, age, gender, weight, height, bmi, bodyType, goal, preference, allergies, conditions, medications, notes } = user;
    return `
    You are an expert dietician. Create a high-quality, personalized 7-day diet plan for the following user:

    User Profile:
    - Name: ${name}
    - Age: ${age}
    - Gender: ${gender}
    - Current Weight: ${weight} kg
    - Height: ${height} cm
    - BMI: ${bmi}
    - Body Type: ${bodyType}
    - Health Goal: ${goal}
    - Diet Preference: ${preference}
    - Allergies: ${allergies.join(', ') || 'None'}
    - Health Conditions: ${conditions.join(', ') || 'None'}
    - Medications: ${medications || 'None'}
    - Additional Notes: ${notes || 'None'}

    Requirements:
    1. The plan must cover 7 days (day1 to day7).
    2. Each day must include: breakfast, lunch, dinner, and snacks.
    3. Ensure no ingredients from the allergies list are included.
    4. Tune the caloric intake and macronutrients to match the goal (${goal}).
    5. Return the response in RAW JSON format only, following this structure:
    {
      "planName": "AI Personalized Plan for ${name}",
      "meals": {
        "day1": { "breakfast": "...", "lunch": "...", "dinner": "...", "snacks": "..." },
        ...
        "day7": { "breakfast": "...", "lunch": "...", "dinner": "...", "snacks": "..." }
      }
    }
    
    Do not add any conversational text, only the JSON.
  `;
};
exports.buildDietPlanPrompt = buildDietPlanPrompt;
//# sourceMappingURL=promptBuilder.js.map