// Component: ReportForm
// Form for submitting daily health reports
import React from 'react';
import { View } from 'react-native';
import AppInput from '../ui/AppInput';
import AppButton from '../ui/AppButton';

const ReportForm: React.FC = () => (
    <View>
        <AppInput label="Steps" placeholder="0" value="" onChangeText={() => { }} />
        <AppInput label="Water (Liters)" placeholder="0.0" value="" onChangeText={() => { }} />
        <AppButton title="Submit Report" onPress={() => { }} />
    </View>
);

export default ReportForm;
