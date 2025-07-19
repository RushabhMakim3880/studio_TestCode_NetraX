
'use server';

import { z } from 'zod';
import nodemailer from 'nodemailer';

const SmtpConfigSchema = z.object({
  smtpHost: z.string(),
  smtpPort: z.number(),
  smtpUser: z.string(),
  smtpPass: z.string(),
  senderAddress: z.string().email(),
});

export type SmtpConfig = z.infer<typeof SmtpConfigSchema>;

const TestEmailInputSchema = SmtpConfigSchema.extend({
  recipientEmail: z.string().email(),
});

type TestEmailInput = z.infer<typeof TestEmailInputSchema>;

export async function sendTestEmail(input: TestEmailInput) {
    const { smtpHost, smtpPort, smtpUser, smtpPass, senderAddress, recipientEmail } = input;

    try {
        // Create a transporter object using SMTP transport
        const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465, // true for 465, false for other ports
            auth: {
                user: smtpUser,
                pass: smtpPass,
            },
            tls: {
                // do not fail on invalid certs
                rejectUnauthorized: false
            }
        });

        // Verify connection configuration
        await transporter.verify();

        // Send mail with defined transport object
        const info = await transporter.sendMail({
            from: `"${senderAddress}" <${senderAddress}>`,
            to: recipientEmail,
            subject: 'NETRA-X Test Email',
            text: 'This is a test email from your NETRA-X platform. Your SMTP settings are configured correctly.',
            html: '<b>This is a test email from your NETRA-X platform.</b><p>Your SMTP settings are configured correctly.</p>',
        });

        return {
            success: true,
            message: `Test email sent successfully to ${recipientEmail}.\nMessage ID: ${info.messageId}`,
        };
    } catch (error: any) {
        console.error('Failed to send test email:', error);
        return {
            success: false,
            message: `Failed to send email: ${error.message}`,
        };
    }
}
