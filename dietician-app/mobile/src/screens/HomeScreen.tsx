// Screen: HomeScreen
// Main dashboard for mobile users
import React from 'react';
import { ScrollView } from 'react-native';
import ScreenWrapper from '../components/layout/ScreenWrapper';
import Header from '../components/layout/Header';
import StatCard from '../components/home/StatCard';
import NotificationBanner from '../components/home/NotificationBanner';

const HomeScreen: React.FC = () => (
    <ScreenWrapper>
        <Header title="My Progress" />
        <ScrollView showsVerticalScrollIndicator={false}>
            <NotificationBanner message="New Diet Plan Assigned! Check the Diet tab." />
            <StatCard label="Steps Today" value="8,432" />
            <StatCard label="Water Intake" value="1.5 L" />
            <StatCard label="Sleep" value="7.5 Hours" />
        </ScrollView>
    </ScreenWrapper>
);

export default HomeScreen;
