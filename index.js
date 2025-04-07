// Import necessary libraries
const { Client, GatewayIntentBits } = require('discord.js');
const dotenv = require('dotenv');
const fetch = require('node-fetch');

// Load environment variables from the .env file
dotenv.config();

// Set up the Discord client with minimal intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
});

// When the bot is logged in and ready
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

// List of suspicious keywords or links (could be expanded)
const suspiciousLinks = [
  'onlyfans', // Detect onlyfans links
  'pornhub',
  'xxx',
  'sex',
  'nude',
  'adult'
];

const weirdKeywords = [
  'weird', 'creepy', 'unusual', 'sketchy', 'strange', 'bizarre'
];

// Function to check if the message contains suspicious content
function containsSuspiciousContent(messageContent) {
  // Check if any suspicious link or keyword is in the message
  for (const link of suspiciousLinks) {
    if (messageContent.toLowerCase().includes(link)) {
      return true;
    }
  }

  // Check for weird keywords
  for (const keyword of weirdKeywords) {
    if (messageContent.toLowerCase().includes(keyword)) {
      return true;
    }
  }

  return false;
}

// Respond to messages
client.on('messageCreate', async message => {
  // Ignore the bot's own messages
  if (message.author.bot) return;

  // If the message contains suspicious content
  if (containsSuspiciousContent(message.content)) {
    message.reply('Get a job at McDonald\'s!');
  }
});

// Handle errors
client.on('error', (error) => {
  console.error('Bot encountered an error:', error);
});

// Log the bot in with the token from the .env file
client.login(process.env.TOKEN);
