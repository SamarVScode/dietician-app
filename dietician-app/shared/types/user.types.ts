// Type: User
// Represents a user profile in the system
// Shared across Dashboard, Mobile, and Functions

export type UserStatus = 'active' | 'inactive' | 'pending';
export type Gender = 'male' | 'female' | 'other';
export type BodyType = 'ectomorph' | 'mesomorph' | 'endomorph';
export type Goal = 'weight-loss' | 'muscle-gain' | 'maintenance' | 'athletic-performance';

export interface User {
  id: string;
  name: string;
  age: number;
  gender: Gender;
  phone: string;
  weight: number; // in kg
  height: number; // in cm
  bmi: number;
  bodyType: BodyType;
  goal: Goal;
  preference: string; // e.g., 'vegetarian', 'vegan', 'non-veg'
  allergies: string[];
  conditions: string[];
  medications: string;
  notes: string;
  userId: string; // generated credentials ID
  passwordHash: string;
  status: UserStatus;
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
}
