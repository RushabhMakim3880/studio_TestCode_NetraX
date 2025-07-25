
'use server';

import { promises as fs } from 'fs';
import path from 'path';
import { z } from 'zod';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

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
  try {
    switch (config.provider) {
      case 'ollama':
        if (!config.ollama) throw new Error("Ollama config is missing.");
        const ollamaResponse = await fetch(`${config.ollama.baseUrl}/api/tags`);
        if (!ollamaResponse.ok) throw new Error(`Ollama API returned status ${ollamaResponse.status}`);
        const ollamaData = await ollamaResponse.json();
        const hasModel = ollamaData.models.some((m: any) => m.name.startsWith(config.ollama!.model));
        if (!hasModel) return { success: false, message: `Ollama is running, but model '${config.ollama.model}' was not found.` };
        return { success: true, message: "Successfully connected to Ollama and model is available." };

      case 'google-cli':
         if (!config.google_cli) throw new Error("Google AI CLI config is missing.");
         // Check if the file exists and is executable
         await fs.access(config.google_cli.path, fs.constants.X_OK);
         return { success: true, message: `Google AI CLI executable found at '${config.google_cli.path}'.`};

      case 'generic':
        if (!config.generic) throw new Error("Generic endpoint config is missing.");
        const genericResponse = await fetch(`${config.generic.baseUrl}/models`, {
            headers: config.generic.apiKey ? { 'Authorization': `Bearer ${config.generic.apiKey}` } : {}
        });
        if (!genericResponse.ok) throw new Error(`Generic endpoint returned status ${genericResponse.status}`);
        return { success: true, message: "Successfully connected to the generic OpenAI-compatible endpoint." };
        
      default:
        throw new Error("Unknown provider specified.");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, message: `Connection test failed: ${message}` };
  }
}
