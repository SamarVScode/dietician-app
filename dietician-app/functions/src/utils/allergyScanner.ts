// Utility: allergyScanner
// Scans generated plan for any forbidden allergy keywords
export const scanForAllergeans = (planJson: string, allergies: string[]): string[] => {
    const found: string[] = [];
    allergies.forEach(allergy => {
        if (planJson.toLowerCase().includes(allergy.toLowerCase())) {
            found.push(allergy);
        }
    });
    return found;
};
