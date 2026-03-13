// Screen: DietPlanScreen
// View for the assigned 7-day diet plan
import React from 'react';
import { ScrollView } from 'react-native';
import ScreenWrapper from '../components/layout/ScreenWrapper';
import Header from '../components/layout/Header';
import DayPlanCard from '../components/dietplan/DayPlanCard';

const DietPlanScreen: React.FC = () => (
    <ScreenWrapper>
        <Header title="My Diet Plan" />
        <ScrollView>
            <DayPlanCard day="Monday" />
            <DayPlanCard day="Tuesday" />
            <DayPlanCard day="Wednesday" />
            <DayPlanCard day="Thursday" />
            <DayPlanCard day="Friday" />
            <DayPlanCard day="Saturday" />
            <DayPlanCard day="Sunday" />
        </ScrollView>
    </ScreenWrapper>
);

export default DietPlanScreen;
