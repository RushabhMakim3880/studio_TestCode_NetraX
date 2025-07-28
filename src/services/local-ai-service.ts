
'use server';

import { promises as fs } from 'fs';
import path from 'path';
import { z } from 'zod';

const OllamaConfigSchema = z.object({
  baseUrl: z.string().url(),
  model: z.string(),
});

const GoogleCliConfigSchema = z.object({
  path: z.string(),
  model: z.string(),
});

const GenericConfigSchema = z.object({
  baseUrl: z.string().url(),
  model: z.string(),
  apiKey: z.string().optional(),
});

const LocalAiConfigSchema = z.object({
  provider: z.enum(['ollama', 'google-cli', 'generic']),
  ollama: OllamaConfigSchema.optional(),
  google_cli: GoogleCliConfigSchema.optional(),
  generic: GenericConfigSchema.optional(),
});

export type LocalAiConfig = z.infer<typeof LocalAiConfigSchema>;

const configPath = path.join(process.cwd(), '.local-ai-config.json');

export async function saveLocalAiConfig(config: LocalAiConfig) {
  try {
    const validatedConfig = LocalAiConfigSchema.parse(config);
    await fs.writeFile(configPath, JSON.stringify(validatedConfig, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to save Local AI config:', error);
    if (error instanceof z.ZodError) {
        throw new Error('Invalid data provided for Local AI config.');
    }
    throw new Error('Could not save Local AI config on the server.');
  }
}

export async function getLocalAiConfig(): Promise<LocalAiConfig | null> {
  try {
    await fs.access(configPath);
    const fileContents = await fs.readFile(configPath, 'utf-8');
    if (!fileContents) return null;
    return LocalAiConfigSchema.parse(JSON.parse(fileContents));
  } catch (error) {
    return null; // File doesn't exist or is invalid
  }
}

export async function testLocalAiConnection(config: LocalAiConfig): Promise<{ success: boolean; message: string }> {
  // This function now acts as a client to our own proxy endpoint.
  // It gets the NEXT_PUBLIC_HOST_URL which should be the address of the Next.js server itself.
  const hostUrl = process.env.NEXT_PUBLIC_HOST_URL || 'http://localhost:3000';
  
  try {
    const response = await fetch(`${hostUrl}/api/local-ai-proxy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Proxy request failed with status ${response.status}`);
    }

    return await response.json();

  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, message: `Connection test failed: ${message}` };
  }
}
