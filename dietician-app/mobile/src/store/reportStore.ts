// Store: reportStore
// Zustand store for report history in mobile
import { create } from 'zustand';

export const useReportStore = create((set) => ({
    reports: [],
    setReports: (reports: any[]) => set({ reports }),
}));
