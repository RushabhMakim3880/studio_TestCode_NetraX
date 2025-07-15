
const API_KEYS_STORAGE_KEY = 'netra-api-keys';

export type ApiKeySettings = {
  VIRUSTOTAL_API_KEY: string;
};

/**
 * Retrieves API keys. In a real app, this would be a secure server-side
 * operation. For this prototype, we'll use a combination of environment
 * variables (as a fallback for developers) and localStorage (for the UI).
 * The server-side will prioritize its own environment variables.
 */
export function getApiKeys(): ApiKeySettings {
    if (typeof window !== 'undefined') {
        // Client-side: read from localStorage for the UI
        const storedKeys = localStorage.getItem(API_KEYS_STORAGE_KEY);
        if (storedKeys) {
            return JSON.parse(storedKeys);
        }
    }
    
    // Server-side or as a fallback on client-side if nothing is in storage
    return {
        VIRUSTOTAL_API_KEY: process.env.VIRUSTOTAL_API_KEY || ''
    };
}

/**
 * Saves API keys. In this prototype, this function runs on the client
 * and saves to localStorage for the settings page UI.
 * @param keys - The API key settings to save.
 */
export function saveApiKeys(keys: ApiKeySettings) {
  if (typeof window === 'undefined') {
    // This function is intended for client-side use in this prototype
    console.warn('saveApiKeys should not be called from the server in this prototype.');
    return;
  }
  localStorage.setItem(API_KEYS_STORAGE_KEY, JSON.stringify(keys));
}

/**
 * A server-side only function to get a specific key, prioritizing
 * the server's environment. This is what server actions should use.
 */
export function getApiKey(key: keyof ApiKeySettings): string | undefined {
    // On the server, always prioritize the process.env variable for security.
    return process.env[key];
}
