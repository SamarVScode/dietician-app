// Type: DailyReport
// Represents a user's daily health and diet report
// Shared across Dashboard, Mobile, and Functions

export type DietFollowed = 'yes' | 'partial' | 'no';

export interface DailyReport {
    id: string;
    userId: string;
    date: string; // YYYY-MM-DD
    steps: number;
    workout: {
        type: string;
        duration: number; // in minutes
        notes: string;
    };
    dietFollowed: DietFollowed;
    waterIntake: number; // in liters
    sleepHours: number;
    notes: string;
    submittedAt: string; // ISO date
}
