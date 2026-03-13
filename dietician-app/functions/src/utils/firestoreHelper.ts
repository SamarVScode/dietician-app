// Utility: firestoreHelper
// Helper functions for common firestore queries
import * as admin from 'firebase-admin';

export const getUserDoc = (userId: string) =>
    admin.firestore().collection('users').doc(userId).get();

export const saveDietPlan = (userId: string, plan: any) =>
    admin.firestore().collection('dietPlans').add({ userId, ...plan, createdAt: admin.firestore.FieldValue.serverTimestamp() });
