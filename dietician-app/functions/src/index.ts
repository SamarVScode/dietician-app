// Cloud Functions Index
// Entry point for all Firebase Cloud Functions
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

admin.initializeApp();

export { createUserAccount } from './auth/createUserAccount';
export { generateDietPlan, assignDietPlan } from './dietplan/generateDietPlan';
export { sendNightlyReminder, sendPlanNotification } from './notifications/sendNightlyReminder';
export { analyzeReports } from './reports/analyzeReports';
