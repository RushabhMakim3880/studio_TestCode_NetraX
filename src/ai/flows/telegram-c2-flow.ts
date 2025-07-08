'use server';
/**
 * @fileOverview A service for interacting with the real Telegram Bot API.
 * This replaces the previous AI simulation.
 *
 * - connectTelegramBot - Validates a bot token by calling the getMe endpoint.
 * - sendTelegramPayload - Sends a message to a chat via the bot.
 */

import { z } from 'zod';

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
  token: z.string().min(20).describe('The Telegram Bot API token.'),
  chatId: z.string().min(1).describe('The target Telegram Chat ID.'),
  message: z.string().min(1).describe('The message or payload to send.'),
});
export type TelegramPayloadInput = z.infer<typeof TelegramPayloadInputSchema>;

const TelegramPayloadOutputSchema = z.object({
  success: z.boolean().describe('Whether the message was sent successfully.'),
  message: z.string().describe('A confirmation or error message from the API.'),
});
export type TelegramPayloadOutput = z.infer<typeof TelegramPayloadOutputSchema>;


export async function connectTelegramBot(input: TelegramConnectInput): Promise<TelegramConnectOutput> {
  const url = `https://api.telegram.org/bot${input.token}/getMe`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.ok) {
      return {
        success: true,
        message: `Successfully connected to bot: @${data.result.username}`,
        botName: data.result.username,
      };
    } else {
      return {
        success: false,
        message: `Connection failed: ${data.description || 'Invalid token'}`,
      };
    }
  } catch (error) {
    return {
      success: false,
      message: 'Network error or failed to reach Telegram API.',
    };
  }
}

export async function sendTelegramPayload(input: TelegramPayloadInput): Promise<TelegramPayloadOutput> {
  const url = `https://api.telegram.org/bot${input.token}/sendMessage`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: input.chatId,
        text: input.message,
      }),
    });

    const data = await response.json();

    if (data.ok) {
      return {
        success: true,
        message: `Message sent successfully to chat ID ${input.chatId}.`,
      };
    } else {
      return {
        success: false,
        message: `Failed to send message: ${data.description || 'Unknown error'}`,
      };
    }
  } catch (error) {
    return {
      success: false,
      message: 'Network error or failed to reach Telegram API.',
    };
  }
}
