"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanForAllergeans = void 0;
// Utility: allergyScanner
// Scans generated plan for any forbidden allergy keywords
const scanForAllergeans = (planJson, allergies) => {
    const found = [];
    allergies.forEach(allergy => {
        if (planJson.toLowerCase().includes(allergy.toLowerCase())) {
            found.push(allergy);
        }
    });
    return found;
};
exports.scanForAllergeans = scanForAllergeans;
//# sourceMappingURL=allergyScanner.js.map