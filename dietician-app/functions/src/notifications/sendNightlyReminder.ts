// Function: sendNightlyReminder
// CRON job to remind users to submit their daily report
import * as functions from 'firebase-functions';

export const sendNightlyReminder = functions.pubsub.schedule('0 20 * * *')
    .timeZone('Asia/Kolkata')
    .onRun(async (context) => {
        // Logic to send FCM to all active users at 8PM
        return null;
    });

export const sendPlanNotification = functions.firestore.document('dietPlans/{planId}')
    .onCreate(async (snap, context) => {
        // Logic to send FCM when a new plan is created
    });
