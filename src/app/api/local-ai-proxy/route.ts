
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { promises as fs } from 'fs';

// Define schemas for validation
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

type LocalAiConfig = z.infer<typeof LocalAiConfigSchema>;

// This is the server-side function that actually performs the checks.
async function performConnectionTest(config: LocalAiConfig): Promise<{ success: boolean; message: string }> {
   try {
    switch (config.provider) {
      case 'ollama':
        if (!config.ollama) throw new Error("Ollama config is missing.");
        // The fetch call is now made from the Next.js server, so it needs to be able to reach the Ollama endpoint.
        // This works if Ollama is running on the same host or in a container accessible to the Next.js server.
        const ollamaResponse = await fetch(`${config.ollama.baseUrl}/api/tags`);
        if (!ollamaResponse.ok) throw new Error(`Ollama API returned status ${ollamaResponse.status}`);
        const ollamaData = await ollamaResponse.json();
        const hasModel = ollamaData.models.some((m: any) => m.name.startsWith(config.ollama!.model));
        if (!hasModel) return { success: false, message: `Ollama is running, but model '${config.ollama.model}' was not found.` };
        return { success: true, message: "Successfully connected to Ollama and model is available." };

      case 'google-cli':
         if (!config.google_cli) throw new Error("Google AI CLI config is missing.");
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


export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const config = LocalAiConfigSchema.parse(body);

        const result = await performConnectionTest(config);

        return NextResponse.json(result);

    } catch (error) {
        console.error("Local AI Proxy Error:", error);
        let errorMessage = "An unknown error occurred.";
        if (error instanceof z.ZodError) {
            errorMessage = "Invalid configuration received by proxy.";
        } else if (error instanceof Error) {
            errorMessage = error.message;
        }
        return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
    }
}
