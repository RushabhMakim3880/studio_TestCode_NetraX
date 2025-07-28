
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

// This function only handles server-side validatable providers now (e.g., file paths)
export async function testLocalAiConnection(config: LocalAiConfig): Promise<{ success: boolean; message: string }> {
   try {
    switch (config.provider) {
      case 'google-cli':
         if (!config.google_cli) throw new Error("Google AI CLI config is missing.");
         await fs.access(config.google_cli.path, fs.constants.X_OK);
         return { success: true, message: `Google AI CLI executable found at '${config.google_cli.path}'.`};
      default:
        // Client-side providers are tested in the browser, so we just return a neutral message here.
        return { success: true, message: 'This provider is tested on the client-side. Click Save and test functionality in the app.' };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, message: `Connection test failed: ${message}` };
  }
}
