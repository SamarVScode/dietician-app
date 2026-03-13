// Screen: DailyReportScreen
// Screen for submitting the daily health log
import React from 'react';
import ScreenWrapper from '../components/layout/ScreenWrapper';
import Header from '../components/layout/Header';
import ReportForm from '../components/report/ReportForm';

const DailyReportScreen: React.FC = () => (
    <ScreenWrapper>
        <Header title="Daily Log" />
        <ReportForm />
    </ScreenWrapper>
);

export default DailyReportScreen;
