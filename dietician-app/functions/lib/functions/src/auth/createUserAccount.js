"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUserAccount = void 0;
// Function: createUserAccount
// Triggered from Dashboard to create a new Auth user
const functions = require("firebase-functions");
exports.createUserAccount = functions.https.onCall(async (data, context) => {
    // Implementation for creating Firebase Auth user
    return { success: true };
});
//# sourceMappingURL=createUserAccount.js.map