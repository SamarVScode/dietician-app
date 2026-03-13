// Hook: useNotifications
// Logic for handling FCM and local notifications in Expo
import * as Notifications from 'expo-notifications';

export const useNotifications = () => {
    return {
        register: async () => { },
        token: null
    };
};
