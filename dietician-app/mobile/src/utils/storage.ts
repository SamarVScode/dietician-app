// Utility: storage
// Expo SecureStore wrapper for persistent local storage
import * as SecureStore from 'expo-secure-store';

export const storage = {
    save: async (key: string, value: string) => {
        await SecureStore.setItemAsync(key, value);
    },
    getValue: async (key: string) => {
        return await SecureStore.getItemAsync(key);
    },
    delete: async (key: string) => {
        await SecureStore.deleteItemAsync(key);
    }
};
