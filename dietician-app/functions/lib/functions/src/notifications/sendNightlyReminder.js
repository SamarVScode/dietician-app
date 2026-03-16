"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPlanNotification = exports.sendNightlyReminder = void 0;
// Function: sendNightlyReminder
// CRON job to remind users to submit their daily report
const functions = require("firebase-functions");
exports.sendNightlyReminder = functions.pubsub.schedule('0 20 * * *')
    .timeZone('Asia/Kolkata')
    .onRun(async (context) => {
    // Logic to send FCM to all active users at 8PM
    return null;
});
exports.sendPlanNotification = functions.firestore.document('dietPlans/{planId}')
    .onCreate(async (snap, context) => {
    // Logic to send FCM when a new plan is created
});
//# sourceMappingURL=sendNightlyReminder.js.map