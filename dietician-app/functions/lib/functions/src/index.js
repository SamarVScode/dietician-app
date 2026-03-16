"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeReports = exports.sendPlanNotification = exports.sendNightlyReminder = exports.assignDietPlan = exports.generateDietPlan = exports.createUserAccount = void 0;
// Cloud Functions Index
// Entry point for all Firebase Cloud Functions
const admin = require("firebase-admin");
admin.initializeApp();
var createUserAccount_1 = require("./auth/createUserAccount");
Object.defineProperty(exports, "createUserAccount", { enumerable: true, get: function () { return createUserAccount_1.createUserAccount; } });
var generateDietPlan_1 = require("./dietplan/generateDietPlan");
Object.defineProperty(exports, "generateDietPlan", { enumerable: true, get: function () { return generateDietPlan_1.generateDietPlan; } });
Object.defineProperty(exports, "assignDietPlan", { enumerable: true, get: function () { return generateDietPlan_1.assignDietPlan; } });
var sendNightlyReminder_1 = require("./notifications/sendNightlyReminder");
Object.defineProperty(exports, "sendNightlyReminder", { enumerable: true, get: function () { return sendNightlyReminder_1.sendNightlyReminder; } });
Object.defineProperty(exports, "sendPlanNotification", { enumerable: true, get: function () { return sendNightlyReminder_1.sendPlanNotification; } });
var analyzeReports_1 = require("./reports/analyzeReports");
Object.defineProperty(exports, "analyzeReports", { enumerable: true, get: function () { return analyzeReports_1.analyzeReports; } });
//# sourceMappingURL=index.js.map