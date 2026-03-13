// Component: MealItem
// Individual meal display within a day plan
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';

const MealItem: React.FC<{ type: string; content: string }> = ({ type, content }) => (
    <View style={styles.item}>
        <Text style={styles.type}>{type}</Text>
        <Text style={styles.content}>{content}</Text>
    </View>
);

const styles = StyleSheet.create({
    item: {
        marginVertical: 4,
    },
    type: {
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.primary,
        textTransform: 'uppercase',
    },
    content: {
        fontSize: 14,
        color: COLORS.foreground,
    }
});

export default MealItem;
