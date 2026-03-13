// Navigator: MainNavigator
// Bottom tab navigator for the main app flow
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import DietPlanScreen from '../screens/DietPlanScreen';
import DailyReportScreen from '../screens/DailyReportScreen';

const Tab = createBottomTabNavigator();

const MainNavigator: React.FC = () => (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Diet" component={DietPlanScreen} />
        <Tab.Screen name="Report" component={DailyReportScreen} />
    </Tab.Navigator>
);

export default MainNavigator;
