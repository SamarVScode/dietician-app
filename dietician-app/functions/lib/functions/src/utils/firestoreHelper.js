"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveDietPlan = exports.getUserDoc = void 0;
// Utility: firestoreHelper
// Helper functions for common firestore queries
const admin = require("firebase-admin");
const getUserDoc = (userId) => admin.firestore().collection('users').doc(userId).get();
exports.getUserDoc = getUserDoc;
const saveDietPlan = (userId, plan) => admin.firestore().collection('dietPlans').add({ userId, ...plan, createdAt: admin.firestore.FieldValue.serverTimestamp() });
exports.saveDietPlan = saveDietPlan;
//# sourceMappingURL=firestoreHelper.js.map