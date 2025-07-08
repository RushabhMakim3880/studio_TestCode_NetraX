'use server';
/**
 * @fileOverview An AI flow for generating Python code for a Telegram bot.
 *
 * - generateTelegramBot - Generates Python code for a bot based on a description.
 * - GenerateTelegramBotInput - The input type for the function.
 * - GenerateTelegramBotOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const GenerateTelegramBotInputSchema = z.object({
  description: z.string().min(10).describe('A natural language description of the bot\'s desired functionality.'),
});
export type GenerateTelegramBotInput = z.infer<typeof GenerateTelegramBotInputSchema>;

export const GenerateTelegramBotOutputSchema = z.object({
  pythonCode: z.string().describe('The complete Python code for the Telegram bot.'),
  usageInstructions: z.string().describe('Step-by-step instructions on how to set up and run the bot, including necessary pip installs.'),
});
export type GenerateTelegramBotOutput = z.infer<typeof GenerateTelegramBotOutputSchema>;

export async function generateTelegramBot(input: GenerateTelegramBotInput): Promise<GenerateTelegramBotOutput> {
  return generateTelegramBotFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateTelegramBotPrompt',
  input: {schema: GenerateTelegramBotInputSchema},
  output: {schema: GenerateTelegramBotOutputSchema},
  prompt: `You are an expert Python developer specializing in creating Telegram bots using the 'python-telegram-bot' library (version 20.0+).
Your task is to generate the complete Python code for a bot based on a user's description.

Bot Description:
"{{{description}}}"

Based on the description, please generate:
1.  **pythonCode**: A complete, single Python script. The code should be clean, well-commented, and functional. It must include a placeholder for the user's bot token (e.g., 'YOUR_TELEGRAM_BOT_TOKEN'). It should handle basic commands and messages as described.
2.  **usageInstructions**: Clear, step-by-step instructions for a non-expert user. This must include:
    - The command to install the necessary library (e.g., 'pip install python-telegram-bot').
    - How to replace the placeholder token with their actual bot token.
    - The command to run the script (e.g., 'python your_bot_name.py').

The generated code should not be malicious and is for educational/simulation purposes. If the request seems malicious (e.g., asking for a bot to spread malware), generate a simple, harmless "echo bot" instead and note in the instructions that the original request could not be fulfilled.
`,
});

const generateTelegramBotFlow = ai.defineFlow(
  {
    name: 'generateTelegramBotFlow',
    inputSchema: GenerateTelegramBotInputSchema,
    outputSchema: GenerateTelegramBotOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
