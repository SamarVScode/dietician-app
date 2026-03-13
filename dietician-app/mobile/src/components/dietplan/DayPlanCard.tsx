// Component: DayPlanCard
// Summary of meals for a single day
import React from 'react';
import { Text } from 'react-native';
import AppCard from '../ui/AppCard';

const DayPlanCard: React.FC<{ day: string }> = ({ day }) => (
    <AppCard>
        <Text style={{ fontWeight: 'bold' }}>{day}</Text>
        {/* Meal items will go here */}
    </AppCard>
);

export default DayPlanCard;
