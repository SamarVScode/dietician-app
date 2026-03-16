"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNotification = void 0;
// Utility: fcmHelper
// Wrapper for sending Firebase Cloud Messages
const admin = require("firebase-admin");
const sendNotification = async (token, title, body) => {
    const message = {
        notification: { title, body },
        token: token,
    };
    return admin.messaging().send(message);
};
exports.sendNotification = sendNotification;
//# sourceMappingURL=fcmHelper.js.map