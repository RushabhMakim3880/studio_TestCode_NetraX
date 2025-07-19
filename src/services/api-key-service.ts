
'use server';

import { promises as fs } from 'fs';
import path from 'path';
import { z } from 'zod';

// Now a dynamic record, not a fixed object
const ApiKeySettingsSchema = z.record(z.string());

export type ApiKeySettings = z.infer<typeof ApiKeySettingsSchema>;

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
    return {};
  }
}

/**
 * A server-side only function that securely retrieves API keys.
 * It prioritizes keys from `secrets.json` over `process.env`.
 * This allows user-set keys to override environment variables.
 */
export async function getApiKeys(): Promise<ApiKeySettings> {
    const secrets = await readSecrets();
    const envKeys: ApiKeySettings = {};

    // Example of how you might still want to support some keys from env
    if (process.env.VIRUSTOTAL_API_KEY) envKeys['VIRUSTOTAL_API_KEY'] = process.env.VIRUSTOTAL_API_KEY;
    if (process.env.WHOIS_API_KEY) envKeys['WHOIS_API_KEY'] = process.env.WHOIS_API_KEY;
    if (process.env.INTELX_API_KEY) envKeys['INTELX_API_KEY'] = process.env.INTELX_API_KEY;

    // Secrets from the file take precedence over environment variables
    return { ...envKeys, ...secrets };
}

/**
 * A server-side only function to get a specific key.
 * This is what other server actions and flows should use.
 */
export async function getApiKey(key: string): Promise<string | undefined> {
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
    await fs.writeFile(secretsPath, JSON.stringify(validatedKeys, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to save secrets:', error);
    if (error instanceof z.ZodError) {
        throw new Error('Invalid data provided for API keys.');
    }
    throw new Error('Could not save API keys on the server.');
  }
}
