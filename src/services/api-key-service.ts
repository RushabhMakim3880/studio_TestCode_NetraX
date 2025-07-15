
'use server';

import { promises as fs } from 'fs';
import path from 'path';
import { z } from 'zod';

const ApiKeySettingsSchema = z.object({
  VIRUSTOTAL_API_KEY: z.string().optional(),
});

export type ApiKeySettings = z.infer<typeof ApiKeySettingsSchema>;

// The path to our secure secrets file.
// Using `path.join` ensures cross-platform compatibility.
// It's placed outside the `src` directory to prevent it from being served.
const secretsPath = path.join(process.cwd(), 'secrets.json');

/**
 * Reads the secrets file from the server's filesystem.
 * @returns A promise that resolves to the parsed ApiKeySettings object.
 */
async function readSecrets(): Promise<ApiKeySettings> {
  try {
    await fs.access(secretsPath);
    const fileContents = await fs.readFile(secretsPath, 'utf-8');
    const parsed = ApiKeySettingsSchema.parse(JSON.parse(fileContents));
    return parsed;
  } catch (error) {
    // If the file doesn't exist or is invalid, return a default empty object.
    return { VIRUSTOTAL_API_KEY: '' };
  }
}

/**
 * A server-side only function that securely retrieves API keys.
 * It prioritizes keys from `secrets.json` over `process.env`.
 * This allows user-set keys to override environment variables.
 */
export async function getApiKeys(): Promise<ApiKeySettings> {
    const secrets = await readSecrets();
    return {
        VIRUSTOTAL_API_KEY: secrets.VIRUSTOTAL_API_KEY || process.env.VIRUSTOTAL_API_KEY || '',
    };
}

/**
 * A server-side only function to get a specific key.
 * This is what other server actions and flows should use.
 */
export async function getApiKey(key: keyof ApiKeySettings): Promise<string | undefined> {
    const keys = await getApiKeys();
    return keys[key];
}


/**
 * A Server Action to securely save API keys to the `secrets.json` file.
 * @param keys - The ApiKeySettings object to save.
 */
export async function saveApiKeys(keys: ApiKeySettings) {
  try {
    const validatedKeys = ApiKeySettingsSchema.parse(keys);
    const currentSecrets = await readSecrets();
    
    // Merge new keys with existing ones to avoid overwriting unrelated secrets
    const newSecrets = { ...currentSecrets, ...validatedKeys };

    await fs.writeFile(secretsPath, JSON.stringify(newSecrets, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to save secrets:', error);
    if (error instanceof z.ZodError) {
        throw new Error('Invalid data provided for API keys.');
    }
    throw new Error('Could not save API keys on the server.');
  }
}
