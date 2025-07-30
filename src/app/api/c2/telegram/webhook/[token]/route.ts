
'use server';

import { NextRequest, NextResponse } from 'next/server';
import { scanSubdomains } from '@/actions/osint-actions';
import { dnsLookup } from '@/actions/osint-actions';
import { generatePhishingEmail } from '@/ai/flows/phishing-flow';
import { whoisLookup } from '@/actions/osint-actions';

const PAYLOAD_LINK = process.env.PAYLOAD_LINK || "YOUR_APK_LINK_PLACEHOLDER";

type CommandResponse = {
    text: string;
    parse_mode?: 'Markdown' | 'HTML';
    reply_markup?: any;
    additionalActions?: Array<{ 
        type: 'send_bait' | 'trigger_attack', 
        targetId?: string, 
        attackType?: string 
    }>;
};

// --- Main Menu ---
const showMainMenu = async (): Promise<CommandResponse> => {
    const text = `*Welcome to the NETRA-X C2 Interface*\n\nPlease select a command category:`;
    const reply_markup = {
        inline_keyboard: [
            [{ text: "🕵️‍♂️ Reconnaissance", callback_data: "menu_recon" }],
            [{ text: "🎣 Phishing", callback_data: "menu_phishing" }],
            [{ text: "📱 Mobile Attacks (Simulated)", callback_data: "menu_mobile" }],
            [{ text: "📡 Health Check", callback_data: "cmd_ping" }],
        ],
    };
    return { text, parse_mode: 'Markdown', reply_markup };
};

// --- Recon Menu ---
const showReconMenu = async (): Promise<CommandResponse> => {
    const text = `*Reconnaissance Menu*\n\nSelect a tool to use:`;
    const reply_markup = {
        inline_keyboard: [
            [{ text: "Subdomain Scan", callback_data: "recon_subdomain" }],
            [{ text: "DNS Lookup", callback_data: "recon_dns" }],
            [{ text: "WHOIS Lookup", callback_data: "recon_whois" }],
            [{ text: "« Back to Main Menu", callback_data: "menu_main" }],
        ],
    };
    return { text, parse_mode: 'Markdown', reply_markup };
};

// --- Phishing Menu ---
const showPhishingMenu = async (): Promise<CommandResponse> => {
    const text = `*Phishing Menu*\n\nSelect a tool to use:`;
    const reply_markup = {
        inline_keyboard: [
            [{ text: "🤖 Generate AI Email", callback_data: "phishing_ai" }],
            [{ text: "« Back to Main Menu", callback_data: "menu_main" }],
        ],
    };
     return { text, parse_mode: 'Markdown', reply_markup };
};

// --- Mobile Attacks Menu (SIMULATED) ---
const showMobileMenu = async (): Promise<CommandResponse> => {
    const text = `*Mobile Attacks Menu (Simulated)*\n\nSelect an attack type to simulate:`;
    const reply_markup = {
        inline_keyboard: [
            [{ text: "📷 Camera", callback_data: "attack_cam" }],
            [{ text: "🎤 Microphone", callback_data: "attack_mic" }],
            [{ text: "📍 Location", callback_data: "attack_loc" }],
            [{ text: "👤 Contacts", callback_data: "attack_contacts" }],
            [{ text: "💬 Messages", callback_data: "attack_msgs" }],
            [{ text: "📋 Clipboard", callback_data: "attack_clip" }],
            [{ text: "🔑 Passwords", callback_data: "attack_pass" }],
            [{ text: "📞 Call Logs", callback_data: "attack_calls" }],
            [{ text: "💥 Nuke All (Simulated)", callback_data: "attack_nuke" }],
            [{ text: "« Back to Main Menu", callback_data: "menu_main" }],
        ],
    };
    return { text, parse_mode: 'Markdown', reply_markup };
};

const conversationState: Record<string, { command: string, step: number, data: any }> = {};

// Command handler for text-based commands
async function handleCommand(command: string, args: string[]): Promise<CommandResponse> {
    const normalizedCommand = command.substring(1).toLowerCase();

    switch (normalizedCommand) {
        case 'ping':
            return { text: 'Pong! The NETRA-X C2 server is active and responsive.' };
        
        case 'start':
        case 'help':
        case 'menu':
            return showMainMenu();
        
        default:
            return { text: `Unknown command: ${command}. Type /start for the main menu.` };
    }
}


// Processes multi-step conversational commands
async function processConversation(state: { command: string, step: number, data: any }, args: string[], chatId: string): Promise<CommandResponse> {
    const commandProcessor = {
        'subdomain': async () => {
            if (state.step === 1) {
                state.step = 2;
                return { text: 'Please enter the domain to scan for subdomains:' };
            }
            if (state.step === 2) {
                delete conversationState[chatId];
                const domain = args[0];
                if (!domain) return { text: 'Invalid domain. Please start over.' };
                try {
                    const subdomains = await scanSubdomains(domain);
                    const message = subdomains.length > 0 
                        ? `*Found ${subdomains.length} subdomains for ${domain}:*\n\`\`\`\n${subdomains.join('\\n')}\n\`\`\``
                        : `No subdomains found for ${domain}.`;
                    return { text: message, parse_mode: 'Markdown' };
                } catch (e: any) { return { text: `Error: ${e.message}` }; }
            }
        },
        'dns': async () => {
             if (state.step === 1) {
                state.step = 2;
                return { text: 'Please enter domain and record type (e.g., `google.com MX`):' };
            }
            if (state.step === 2) {
                delete conversationState[chatId];
                if (args.length < 2) return { text: 'Invalid input. Please provide domain and record type.' };
                try {
                    const records = await dnsLookup(args[0], args[1].toUpperCase());
                    const message = records.length > 0 
                        ? `*DNS Records for ${args[0]} [${args[1].toUpperCase()}]:*\n\`\`\`\n${records.map(r => r.value).join('\\n')}\n\`\`\``
                        : 'No records found.';
                    return { text: message, parse_mode: 'Markdown' };
                } catch(e: any) { return { text: `Error: ${e.message}` }; }
            }
        },
        'whois': async () => {
             if (state.step === 1) {
                state.step = 2;
                return { text: 'Please enter the domain for WHOIS lookup:' };
            }
             if (state.step === 2) {
                delete conversationState[chatId];
                if (!args[0]) return { text: 'Invalid domain. Please start over.'};
                try {
                    const result = await whoisLookup(args[0]);
                    return { text: `*WHOIS Record for ${args[0]}:*\n\`\`\`\n${result}\n\`\`\``, parse_mode: 'Markdown' };
                } catch(e: any) { return { text: `Error: ${e.message}` }; }
            }
        },
        'ai': async () => { // Phishing AI
            if (state.step === 1) {
                state.step = 2;
                return { text: 'Describe the phishing scenario (e.g., "Urgent invoice for accountant at Google"):' };
            }
            if (state.step === 2) {
                delete conversationState[chatId];
                const scenario = args.join(' ');
                if (!scenario) return { text: 'Invalid scenario. Please start over.' };
                try {
                    const result = await generatePhishingEmail({ company: 'Target', role: 'Employee', scenario });
                    return { 
                        text: `*Subject:* ${result.subject}\n\n*Body:*\n${result.body.replace(/<[^>]+>/g, '')}`,
                        parse_mode: 'Markdown'
                    };
                } catch(e: any) { return { text: `Error: ${e.message}` }; }
            }
        }
    };
    
    const processor = commandProcessor[state.command as keyof typeof commandProcessor];
    if (processor) {
        return await processor();
    }

    delete conversationState[chatId];
    return { text: 'Something went wrong. Please start over with /start.' };
}


// Primary message handler
async function handleMessage(message: any): Promise<CommandResponse> {
    const chatId = message.chat.id.toString();
    const text = message.text || '';
    
    // Check if we are in the middle of a conversation
    if (conversationState[chatId]) {
        const state = conversationState[chatId];
        const args = text.trim().split(/\s+/);
        return await processConversation(state, args, chatId);
    }
    
    // Check for standard text commands
    if (text.startsWith('/')) {
        const parts = text.trim().split(/\s+/);
        const command = parts[0];
        const args = parts.slice(1);
        return await handleCommand(command, args);
    }

    // Default response for unhandled text
    return await showMainMenu();
}

// Handler for inline keyboard button presses
async function handleCallbackQuery(callbackQuery: any): Promise<CommandResponse> {
    const data = callbackQuery.data;
    const chatId = callbackQuery.message.chat.id.toString();
    const [command, ...args] = data.split('_');

    // Clear any previous conversation state
    delete conversationState[chatId];

    switch (command) {
        case 'menu':
            if (args[0] === 'recon') return await showReconMenu();
            if (args[0] === 'phishing') return await showPhishingMenu();
            if (args[0] === 'mobile') return await showMobileMenu();
            return await showMainMenu();
        
        case 'cmd':
            return await handleCommand(`/${args[0]}`, [],);
        
        case 'recon':
        case 'phishing':
            conversationState[chatId] = { command: args[0], step: 1, data: {} };
            return await processConversation(conversationState[chatId], [], chatId);
            
        case 'attack':
             // THIS IS A SIMULATION ONLY
            return { text: `Simulating *${args[0]}* attack... The action has been logged in the platform.`, parse_mode: 'Markdown' };

        default:
            return { text: 'Unknown selection.' };
    }
}

// Helper to send messages to the Telegram API
async function sendTelegramResponse(token: string, method: 'sendMessage' | 'editMessageText', payload: any) {
    try {
        const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        
        if (!response.ok) {
            const errorBody = await response.text();
            console.error('Telegram API Error:', errorBody);
        }
    } catch (error) {
        console.error('Failed to send Telegram message:', error);
    }
}

// Main API Route Handler
export async function POST(req: NextRequest, { params }: { params: { token: string }}) {
    const token = params.token;
    if (!token) return NextResponse.json({ error: 'Webhook misconfigured.' }, { status: 401 });

    try {
        const body = await req.json();
        let responsePayload: CommandResponse;
        let method: 'sendMessage' | 'editMessageText' = 'sendMessage';
        let chatId: string | undefined;
        let messageId: number | undefined;

        if (body.callback_query) {
            method = 'editMessageText';
            responsePayload = await handleCallbackQuery(body.callback_query);
            chatId = body.callback_query.message?.chat?.id?.toString();
            messageId = body.callback_query.message?.message_id;
            // Acknowledge the button press
            await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery?callback_query_id=${body.callback_query.id}`);
        } else if (body.message) {
            responsePayload = await handleMessage(body.message);
            chatId = body.message.chat?.id?.toString();
        } else {
            return NextResponse.json({ status: 'ok', message: 'Update type not handled.' });
        }
        
        if (!chatId) return NextResponse.json({ status: 'ok', message: 'Could not determine chat ID.' });

        const apiPayload: any = {
            chat_id: chatId,
            text: responsePayload.text,
            ...(responsePayload.parse_mode && { parse_mode: responsePayload.parse_mode }),
            ...(responsePayload.reply_markup && { reply_markup: responsePayload.reply_markup })
        };
        
        if (method === 'editMessageText' && messageId) {
            apiPayload.message_id = messageId;
        }

        await sendTelegramResponse(token, method, apiPayload);

        return NextResponse.json({ status: 'ok' });

    } catch (error) {
        console.error('Error in Telegram webhook:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
