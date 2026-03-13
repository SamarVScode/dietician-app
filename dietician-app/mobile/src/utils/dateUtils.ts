// Utility: dateUtils
// Date formatting helpers for mobile
import { format } from 'date-fns';

export const formatDate = (date: string | Date) => format(new Date(date), 'PPP');
export const formatShortDate = (date: string | Date) => format(new Date(date), 'dd/MM/yy');
