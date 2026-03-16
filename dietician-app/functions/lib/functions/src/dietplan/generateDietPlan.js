"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assignDietPlan = exports.generateDietPlan = void 0;
// Function: generateDietPlan
// Calls Claude AI to generate a personalized diet plan
const functions = require("firebase-functions");
exports.generateDietPlan = functions.https.onCall(async (data, context) => {
    // Logic to build prompt and call Claude API
    return { plan: {} };
});
exports.assignDietPlan = functions.https.onCall(async (data, context) => {
    // Logic to save plan and notify user
    return { success: true };
});
//# sourceMappingURL=generateDietPlan.js.map