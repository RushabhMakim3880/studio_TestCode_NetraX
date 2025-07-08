'use server';
/**
 * @fileOverview An AI flow for simulating a Telegram bot for C2 communications.
 *
 * - connectTelegramBot - Simulates validating a bot token.
 * - sendTelegramPayload - Simulates sending a message via the bot.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Schema for connecting the bot
const TelegramConnectInputSchema = z.object({
  token: z.string().min(20).describe('The Telegram Bot API token.'),
});
export type TelegramConnectInput = z.infer<typeof TelegramConnectInputSchema>;

const TelegramConnectOutputSchema = z.object({
  success: z.boolean().describe('Whether the connection was successful.'),
  message: z.string().describe('A message detailing the result of the connection attempt.'),
  botName: z.string().optional().describe('The name of the bot if connection is successful.'),
});
export type TelegramConnectOutput = z.infer<typeof TelegramConnectOutputSchema>;

// Schema for sending a payload
const TelegramPayloadInputSchema = z.object({
  chatId: z.string().min(1).describe('The target Telegram Chat ID.'),
  message: z.string().min(1).describe('The message or payload to send.'),
});
export type TelegramPayloadInput = z.infer<typeof TelegramPayloadInputSchema>;

const TelegramPayloadOutputSchema = z.object({
  success: z.boolean().describe('Whether the message was sent successfully.'),
  message: z.string().describe('A confirmation or error message from the API.'),
});
export type TelegramPayloadOutput = z.infer<typeof TelegramPayloadOutputSchema>;

// Exported functions
export async function connectTelegramBot(input: TelegramConnectInput): Promise<TelegramConnectOutput> {
  return connectBotFlow(input);
}

export async function sendTelegramPayload(input: TelegramPayloadInput): Promise<TelegramPayloadOutput> {
    return sendPayloadFlow(input);
}


// Connect Bot Flow
const connectBotPrompt = ai.definePrompt({
  name: 'connectTelegramBotPrompt',
  input: {schema: TelegramConnectInputSchema},
  output: {schema: TelegramConnectOutputSchema},
  prompt: `You are a simulator for the Telegram Bot API. Your task is to respond to a 'getMe' API call.
Based on the provided token, decide if the token is "valid" or "invalid". About 90% of the time, it should be valid.

If the token is valid, return:
- success: true
- message: A realistic success message, like "OK: Bot connected successfully."
- botName: A plausible bot username, like "Stage1_PayloadBot" or "C2_Operator_Bot".

If the token is invalid, return:
- success: false
- message: A realistic error message, like "Error: Unauthorized. Please check your token."
- botName: (omitted)

Do not include any conversational text.
`,
});

const connectBotFlow = ai.defineFlow(
  {
    name: 'connectBotFlow',
    inputSchema: TelegramConnectInputSchema,
    outputSchema: TelegramConnectOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);


// Send Payload Flow
const sendPayloadPrompt = ai.definePrompt({
    name: 'sendTelegramPayloadPrompt',
    input: {schema: TelegramPayloadInputSchema},
    output: {schema: TelegramPayloadOutputSchema},
    prompt: `You are a simulator for the Telegram Bot API. Your task is to respond to a 'sendMessage' API call.
Assume the bot is already connected. Your only job is to confirm the message was sent.

Return a success response:
- success: true
- message: A realistic success message, like "OK: Message sent to chat_id {{{chatId}}}."

Do not include any conversational text.
`,
  });
  
  const sendPayloadFlow = ai.defineFlow(
    {
      name: 'sendPayloadFlow',
      inputSchema: TelegramPayloadInputSchema,
      outputSchema: TelegramPayloadOutputSchema,
    },
    async input => {
      const {output} = await prompt(input);
      return output!;
    }
  );
