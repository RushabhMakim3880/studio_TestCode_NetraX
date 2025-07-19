
import { NextRequest, NextResponse } from 'next/server';
import { sendTelegramPayload } from '@/ai/flows/telegram-c2-flow';
import { scanSubdomains } from '@/actions/osint-actions';
import { dnsLookup } from '@/actions/osint-actions';

// This is the webhook endpoint that your Telegram bot will call.
// It must be accessible from the internet (e.g., via ngrok or a public deployment).
// The bot token is passed in the header for security.

type CommandResponse = {
    success: boolean;
    message: string;
};

// A simple command router to execute actions based on the message text.
async function handleCommand(command: string, args: string[]): Promise<CommandResponse> {
    switch (command) {
        case '!ping':
            return { success: true, message: 'Pong!' };

        case '!subdomainscan':
            if (args.length === 0) return { success: false, message: 'Usage: !subdomainscan <domain>' };
            try {
                const subdomains = await scanSubdomains(args[0]);
                if (subdomains.length === 0) return { success: true, message: `No subdomains found for ${args[0]}.` };
                return { success: true, message: `Found ${subdomains.length} subdomains for ${args[0]}:\n${subdomains.join('\n')}` };
            } catch (e: any) {
                return { success: false, message: `Subdomain scan failed: ${e.message}` };
            }

        case '!dnslookup':
            if (args.length < 2) return { success: false, message: 'Usage: !dnslookup <domain> <record_type>' };
            try {
                const records = await dnsLookup(args[0], args[1].toUpperCase());
                if (records.length === 0) return { success: true, message: `No ${args[1].toUpperCase()} records found for ${args[0]}.`};
                const formattedRecords = records.map(r => r.value).join('\n');
                return { success: true, message: `DNS Records for ${args[0]} [${args[1].toUpperCase()}]:\n${formattedRecords}` };
            } catch (e: any) {
                return { success: false, message: `DNS lookup failed: ${e.message}` };
            }

        default:
            return { success: false, message: `Unknown command: ${command}` };
    }
}


export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { message, chat_id } = body;
        const token = req.headers.get('X-Telegram-Bot-Token');

        if (!token) {
            return NextResponse.json({ error: 'Bot token is required' }, { status: 401 });
        }
        if (!message || !chat_id) {
            return NextResponse.json({ error: 'Message and chat_id are required' }, { status: 400 });
        }

        // Simple command parsing: !command arg1 arg2 ...
        const parts = message.trim().split(/\s+/);
        const command = parts[0];
        const args = parts.slice(1);

        if (!command.startsWith('!')) {
            // Ignore messages that are not commands
            return NextResponse.json({ status: 'ignored' });
        }
        
        // Execute the command and get a response message
        const commandResponse = await handleCommand(command, args);
        
        // Send the result back to the user via the bot
        const sendResponse = await sendTelegramPayload({
            token,
            chatId: chat_id.toString(),
            message: commandResponse.message,
        });

        if (!sendResponse.success) {
            // Log if we failed to send the response back
            console.error(`Webhook: Failed to send response for command "${command}" to chat ${chat_id}. Reason: ${sendResponse.message}`);
        }

        return NextResponse.json({ status: 'ok', response: commandResponse });

    } catch (error) {
        console.error('Error in Telegram webhook:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
