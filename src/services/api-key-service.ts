
/**
 * @fileOverview A server-side utility for accessing API keys from environment variables.
 */

export type ApiKeySettings = {
  VIRUSTOTAL_API_KEY: string;
};

/**
 * A server-side only function to get a specific key from environment variables.
 * This is the secure way for server actions and flows to access secrets.
 * @param key The name of the API key to retrieve.
 * @returns The API key string, or undefined if not found.
 */
export function getApiKey(key: keyof ApiKeySettings): string | undefined {
    // On the server, always prioritize the process.env variable for security.
    return process.env[key];
}
