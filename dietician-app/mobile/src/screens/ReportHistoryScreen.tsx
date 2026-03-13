// Screen: ReportHistoryScreen
// History of submitted daily reports
import React from 'react';
import { FlatList } from 'react-native';
import ScreenWrapper from '../components/layout/ScreenWrapper';
import Header from '../components/layout/Header';

const ReportHistoryScreen: React.FC = () => (
    <ScreenWrapper>
        <Header title="History" />
        <FlatList
            data={[]}
            renderItem={() => null}
            ListEmptyComponent={() => <h2 style={{ textAlign: 'center', marginTop: 50 }}>No history found</h2>}
        />
    </ScreenWrapper>
);

export default ReportHistoryScreen;
