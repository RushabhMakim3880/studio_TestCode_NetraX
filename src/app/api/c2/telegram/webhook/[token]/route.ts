// Fixed and enhanced version of your Telegram bot webhook code
import { NextRequest, NextResponse } from 'next/server';
import { sendTelegramPayload } from '@/ai/flows/telegram-c2-flow';
import { scanSubdomains, dnsLookup, whoisLookup } from '@/actions/osint-actions';
import { generatePhishingEmail } from '@/ai/flows/phishing-flow';

// Extend the sendTelegramPayload function in '@/ai/flows/telegram-c2-flow' to include 'method'
// Example:
// type TelegramPayload = {
//   token: string;
//   chatId: string;
//   message: string;
//   otherParams?: any;
//   method?: 'sendMessage' | 'editMessageText';
// };
// export async function sendTelegramPayload(payload: TelegramPayload) {
//   const { token, chatId, message, otherParams, method = 'sendMessage' } = payload;
//   const telegramMethod = method;
//   const url = `https://api.telegram.org/bot${token}/${telegramMethod}`;
//   const payloadBody = {
//     chat_id: chatId,
//     text: message,
//     ...otherParams,
//   };
//   await fetch(url, {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify(payloadBody),
//   });
// }

type CommandResponse = {
  text: string;
  parse_mode?: 'Markdown' | 'HTML';
  reply_markup?: any;
};

const showMainMenu = async (chatId: string): Promise<CommandResponse> => {
  const text = `Welcome to the NETRA-X C2 Interface\nPlease select a command category from the menu below:`;
  const reply_markup = {
    inline_keyboard: [
      [{ text: 'Reconnaissance', callback_data: 'menu_recon' }],
      [{ text: 'Phishing', callback_data: 'menu_phishing' }],
      [{ text: 'Health Check', callback_data: 'cmd_ping' }],
    ],
  };
  return { text, parse_mode: 'Markdown', reply_markup };
};

const showReconMenu = async (): Promise<CommandResponse> => {
  const text = `Reconnaissance Menu\nSelect a tool to use:`;
  const reply_markup = {
    inline_keyboard: [
      [{ text: 'Subdomain Scan', callback_data: 'recon_subdomain' }],
      [{ text: 'DNS Lookup', callback_data: 'recon_dns' }],
      [{ text: 'WHOIS Lookup', callback_data: 'recon_whois' }],
      [{ text: '« Back to Main Menu', callback_data: 'menu_main' }],
    ],
  };
  return { text, parse_mode: 'Markdown', reply_markup };
};

const showPhishingMenu = async (): Promise<CommandResponse> => {
  const text = `Phishing Menu\nSelect a tool to use:`;
  const reply_markup = {
    inline_keyboard: [
      [{ text: 'Generate AI Email', callback_data: 'phishing_ai' }],
      [{ text: '« Back to Main Menu', callback_data: 'menu_main' }],
    ],
  };
  return { text, parse_mode: 'Markdown', reply_markup };
};

const conversationState: Record<string, { command: string; step: number; data: any }> = {};

async function handleCommand(command: string, args: string[], chatId: string): Promise<CommandResponse> {
  const normalizedCommand = command.substring(1).toLowerCase();
  switch (normalizedCommand) {
    case 'ping':
      return { text: 'Pong! The NETRA-X C2 server is active and responsive.' };
    case 'start':
    case 'help':
    case 'menu':
      return showMainMenu(chatId);
    default:
      return { text: `Unknown command: ${command}. Type /start for the main menu.` };
  }
}

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

async function handleCallbackQuery(callbackQuery: any): Promise<CommandResponse> {
  const data = callbackQuery.data;
  const chatId = callbackQuery.message.chat.id.toString();
  const [command, ...args] = data.split('_');
  switch (command) {
    case 'menu':
      if (args[0] === 'recon') return showReconMenu();
      if (args[0] === 'phishing') return showPhishingMenu();
      return showMainMenu(chatId);
    case 'cmd':
      return handleCommand(`/${args[0]}`, [], chatId);
    case 'recon':
    case 'phishing':
      conversationState[chatId] = { command: args[0], step: 1, data: {} };
      return processConversation(conversationState[chatId], [], chatId);
    default:
      return { text: 'Unknown selection.' };
  }
}

async function processConversation(
  state: { command: string; step: number; data: any },
  args: string[],
  chatId: string
): Promise<CommandResponse> {
  switch (state.command) {
    case 'subdomain': {
      if (state.step === 1) {
        state.step = 2;
        return { text: 'Please enter the domain you want to scan for subdomains:' };
      }
      if (state.step === 2) {
        delete conversationState[chatId];
        const domain = args[0];
        if (!domain) return { text: 'Invalid domain. Please start over.' };
        try {
          const subdomains = await scanSubdomains(domain);
          const message = subdomains.length
            ? `Found ${subdomains.length} subdomains for ${domain}:\n${subdomains.join('\n')}`
            : `No subdomains found for ${domain}.`;
          return { text: message };
        } catch (e: any) {
          return { text: `Error: ${e.message}` };
        }
      }
      break;
    }
    case 'dns': {
      if (state.step === 1) {
        state.step = 2;
        return { text: 'Please enter the domain and record type (e.g., `google.com MX`):' };
      }
      if (state.step === 2) {
        delete conversationState[chatId];
        if (args.length < 2) return { text: 'Invalid input. Please provide both a domain and record type. Start over.' };
        try {
          const records = await dnsLookup(args[0], args[1].toUpperCase());
          const message = records.length
            ? `DNS Records for ${args[0]} [${args[1].toUpperCase()}]:\n${records.map((r: any) => r.value).join('\n')}`
            : 'No records found.';
          return { text: message };
        } catch (e: any) {
          return { text: `Error: ${e.message}` };
        }
      }
      break;
    }
    case 'whois': {
      if (state.step === 1) {
        state.step = 2;
        return { text: 'Please enter the domain for the WHOIS lookup:' };
      }
      if (state.step === 2) {
        delete conversationState[chatId];
        if (!args[0]) return { text: 'Invalid domain. Please start over.' };
        try {
          const result = await whoisLookup(args[0]);
          return { text: `WHOIS Record for ${args[0]}:\n\n${result}` };
        } catch (e: any) {
          return { text: `Error: ${e.message}` };
        }
      }
      break;
    }
    case 'ai': {
      if (state.step === 1) {
        state.step = 2;
        return { text: 'Describe the phishing scenario (e.g., "An urgent invoice for an accountant at Google"):' };
      }
      if (state.step === 2) {
        delete conversationState[chatId];
        const scenario = args.join(' ');
        if (!scenario) return { text: 'Invalid scenario. Please start over.' };
        try {
          const result = await generatePhishingEmail({ company: 'Target', role: 'Employee', scenario });
          return {
            text: `*Subject:* ${result.subject}\n\n*Body:*\n${result.body.replace(/<[^>]+>/g, '')}`,
            parse_mode: 'Markdown',
          };
        } catch (e: any) {
          return { text: `Error: ${e.message}` };
        }
      }
      break;
    }
  }
  delete conversationState[chatId];
  return { text: 'Something went wrong. Please start over with /start.' };
}

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const token = params.token;
  if (!token) {
    return NextResponse.json({ error: 'Webhook misconfigured.' }, { status: 401 });
  }
  try {
    const body = await req.json();
    let responsePayload: CommandResponse;
    let isCallback = false;

    if (body.callback_query) {
      isCallback = true;
      responsePayload = await handleCallbackQuery(body.callback_query);
      await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery?callback_query_id=${body.callback_query.id}`);
    } else if (body.message) {
      responsePayload = await handleMessage(body.message);
    } else {
      return NextResponse.json({ status: 'ok', message: 'Update type not handled.' });
    }

    const chatId = body.message?.chat?.id || body.callback_query?.message?.chat?.id;
    const messageId = body.callback_query?.message?.message_id;

    if (!chatId) {
      return NextResponse.json({ status: 'ok', message: 'Could not determine chat ID.' });
    }

    const telegramApiMethod = isCallback ? 'editMessageText' : 'sendMessage';

    await sendTelegramPayload({
      token,
      chatId: chatId.toString(),
      message: responsePayload.text,
      otherParams: {
        ...(messageId && { message_id: messageId }),
        parse_mode: responsePayload.parse_mode,
        reply_markup: responsePayload.reply_markup,
      },
      method: telegramApiMethod,
    });

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Error in Telegram webhook:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}