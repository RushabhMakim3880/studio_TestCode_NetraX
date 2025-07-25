
'use server';

import { promises as fs } from 'fs';
import path from 'path';
import { z } from 'zod';

// Now a dynamic record, not a fixed object
const ApiKeySettingsSchema = z.record(z.string());

export type ApiKeySettings = z.infer<typeof ApiKeySettingsSchema>;

const secretsPath = path.join(process.cwd(), '.secrets.json');

/**
 * Reads the secrets file from the server's filesystem.
 * @returns A promise that resolves to the parsed ApiKeySettings object.
 */
async function readSecrets(): Promise<ApiKeySettings> {
  try {
    await fs.access(secretsPath);
    const fileContents = await fs.readFile(secretsPath, 'utf-8');
    if (!fileContents) return {}; // Handle empty file
    const parsed = ApiKeySettingsSchema.parse(JSON.parse(fileContents));
    return parsed;
  } catch (error) {
    // If the file doesn't exist or is invalid, return a default empty object.
    return {};
  }
}

/**
 * A server-side only function that securely retrieves API keys.
 * It merges keys from `process.env` and the user-defined `secrets.json`.
 * Keys from `secrets.json` take precedence.
 */
export async function getApiKeys(): Promise<{ userDefined: ApiKeySettings, environment: ApiKeySettings }> {
    const userDefined = await readSecrets();
    const environment: ApiKeySettings = {};

    // Define which env vars to expose to the settings UI
    const allowedEnvKeys = ['VIRUSTOTAL_API_KEY', 'WHOIS_API_KEY', 'INTELX_API_KEY', 'GEMINI_API_KEY'];
    
    for (const key of allowedEnvKeys) {
        if (process.env[key]) {
            // Only add env keys if they are not overridden by the user
            if (!userDefined.hasOwnProperty(key)) {
                environment[key] = process.env[key]!;
            }
        }
    }
    
    return { userDefined, environment };
}


/**
 * A server-side only function to get a specific key's value, checking user-defined keys first.
 * This is what other server actions and flows should use.
 */
export async function getApiKey(key: string): Promise<string | undefined> {
    const { userDefined, environment } = await getApiKeys();
    // User-defined keys from secrets.json take precedence
    if (userDefined[key]) {
        return userDefined[key];
    }
    // Then check environment variables
    if (environment[key]) {
        return environment[key];
    }
    // Also check process.env directly for keys not exposed in the UI
    return process.env[key];
}


/**
 * A Server Action to securely save API keys to the `.secrets.json` file.
 * @param keys - The ApiKeySettings object to save.
 */
export async function saveApiKeys(keys: ApiKeySettings) {
  try {
    const validatedKeys = ApiKeySettingsSchema.parse(keys);
    await fs.writeFile(secretsPath, JSON.stringify(validatedKeys, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to save secrets:', error);
    if (error instanceof z.ZodError) {
        throw new Error('Invalid data provided for API keys.');
    }
    throw new Error('Could not save API keys on the server.');
  }
}
