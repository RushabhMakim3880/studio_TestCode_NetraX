
'use server';

import { z } from 'zod';

const WebhookInputSchema = z.object({
  webhookUrl: z.string().url(),
  message: z.string(),
});

export async function sendWebhookNotification(input: z.infer<typeof WebhookInputSchema>) {
    try {
        const { webhookUrl, message } = WebhookInputSchema.parse(input);

        // Discord expects a "content" field
        // Slack expects a "text" field
        // We'll send both for compatibility
        const payload = {
            content: message,
            text: message,
        };

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(`Webhook failed with status: ${response.status}`);
        }
    } catch (e) {
        console.error("Failed to send webhook notification:", e);
        if (e instanceof Error) {
            throw new Error(`Failed to send notification: ${e.message}`);
        }
        throw new Error('An unknown error occurred while sending the webhook.');
    }
}
