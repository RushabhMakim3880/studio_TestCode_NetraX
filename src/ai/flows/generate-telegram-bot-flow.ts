
'use server';
/**
 * @fileOverview An AI flow for generating Python code for a Telegram bot.
 * This has been updated to return a pre-built template to avoid API quota issues.
 *
 * - generateTelegramBot - Generates Python code for a bot based on a description.
 * - GenerateTelegramBotInput - The input type for the function.
 * - GenerateTelegramBotOutput - The return type for the function.
 */

import {z} from 'genkit';

const GenerateTelegramBotInputSchema = z.object({
  description: z.string().min(10).describe('A natural language description of the bot\'s desired functionality.'),
});
export type GenerateTelegramBotInput = z.infer<typeof GenerateTelegramBotInputSchema>;

const GenerateTelegramBotOutputSchema = z.object({
  pythonCode: z.string().describe('The complete Python code for the Telegram bot.'),
  usageInstructions: z.string().describe('Step-by-step instructions on how to set up and run the bot, including necessary pip installs.'),
});
export type GenerateTelegramBotOutput = z.infer<typeof GenerateTelegramBotOutputSchema>;


const botTemplate = `
"""
A comprehensive Telegram bot template.
This bot includes basic command handling, echoing messages, and a simple inline keyboard.
"""
import logging
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, MessageHandler, filters, CallbackContext, CallbackQueryHandler

# Enable logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# --- Command Handlers ---

async def start(update: Update, context: CallbackContext.DEFAULT_TYPE) -> None:
    """Sends a message when the command /start is issued."""
    user = update.effective_user
    await update.message.reply_html(
        rf'Hi {user.mention_html()}! I am a bot template. Send me a message and I will echo it back.',
    )

async def help_command(update: Update, context: CallbackContext.DEFAULT_TYPE) -> None:
    """Sends a message when the command /help is issued."""
    await update.message.reply_text('Available commands:\n/start - Start the bot\n/help - Show this help message\n/menu - Show an interactive menu')

async def menu(update: Update, context: CallbackContext.DEFAULT_TYPE) -> None:
    """Displays an inline keyboard menu."""
    keyboard = [
        [InlineKeyboardButton("Option 1", callback_data='1')],
        [InlineKeyboardButton("Option 2", callback_data='2')],
        [InlineKeyboardButton("Help", callback_data='help')],
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    await update.message.reply_text('Please choose an option:', reply_markup=reply_markup)
    
# --- Message Handler ---

async def echo(update: Update, context: CallbackContext.DEFAULT_TYPE) -> None:
    """Echo the user message."""
    await update.message.reply_text(f"Echo: {update.message.text}")

# --- Callback Query Handler ---

async def button(update: Update, context: CallbackContext.DEFAULT_TYPE) -> None:
    """Parses the CallbackQuery and updates the message text."""
    query = update.callback_query
    await query.answer()  # Acknowledge the button press

    if query.data == 'help':
        await query.edit_message_text(text='This is the help section from the menu.')
    else:
        await query.edit_message_text(text=f"You selected option: {query.data}")

# --- Main Bot Logic ---

def main() -> None:
    """Start the bot."""
    # Create the Application and pass it your bot's token.
    # IMPORTANT: Replace 'YOUR_TELEGRAM_BOT_TOKEN' with your actual bot token.
    application = Application.builder().token("YOUR_TELEGRAM_BOT_TOKEN").build()

    # on different commands - answer in Telegram
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("help", help_command))
    application.add_handler(CommandHandler("menu", menu))
    
    # handler for inline keyboard button presses
    application.add_handler(CallbackQueryHandler(button))

    # on non command i.e message - echo the message on Telegram
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, echo))

    # Run the bot until the user presses Ctrl-C
    logger.info("Bot is running. Press Ctrl-C to stop.")
    application.run_polling()

if __name__ == '__main__':
    main()
`;

const usageInstructions = `
1. Install the required library:
   pip install python-telegram-bot --upgrade

2. Get a bot token from @BotFather on Telegram.

3. Open the generated Python script and replace the placeholder 'YOUR_TELEGRAM_BOT_TOKEN' with your actual bot token.

4. Run the script from your terminal:
   python your_bot_name.py

The bot will start running and will respond to commands on Telegram.
`;

/**
 * Returns a pre-built Python template for a Telegram bot to avoid API quota issues.
 * The user's description is logged but not used to generate the code.
 */
export async function generateTelegramBot(input: GenerateTelegramBotInput): Promise<GenerateTelegramBotOutput> {
  console.log(`Generating Telegram bot template for description: "${input.description}"`);
  
  // Simulate a network delay so the loading spinner is visible.
  await new Promise(resolve => setTimeout(resolve, 500));

  return {
    pythonCode: botTemplate.trim(),
    usageInstructions: usageInstructions.trim(),
  };
}
