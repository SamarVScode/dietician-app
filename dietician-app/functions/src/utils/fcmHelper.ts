// Utility: fcmHelper
// Wrapper for sending Firebase Cloud Messages
import * as admin from 'firebase-admin';

export const sendNotification = async (token: string, title: string, body: string) => {
    const message = {
        notification: { title, body },
        token: token,
    };
    return admin.messaging().send(message);
};
