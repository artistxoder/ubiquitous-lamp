// Load environment variables first
require("dotenv").config();
console.log("Starting bot (index.js)...");

const Eris = require("eris");
// Ensure you are using Node.js v18+ and have REMOVED node-fetch dependency
// const fetch = require("node-fetch"); // <-- Make sure this line is removed or commented out

// Bot Client Initialization with Memory Saving Options
const bot = new Eris(process.env.TOKEN, {
  intents: ["guilds", "guildMessages", "messageContent"], // Ensure ONLY needed intents are listed
  messageLimit: 5, // Reduce messages cached per channel to save memory

  // --- ADD MORE OPTIONS HERE (VERIFY NAMES IN ERIS 0.17.2 DOCS!) ---
  // Check the Eris v0.17.2 documentation for options to disable caching
  // for things your bot doesn't need, like presence or detailed member data.
  // Examples of what to look for (replace with actual option names):
  // somePresenceOptionToDisable: true, // e.g., disableGuildPresences
  // someMemberCacheOptionToDisable: true, // e.g., disableGuildMembers, getAllUsers: false
  // --- End additional options ---

});

const suspiciousLinks = ['onlyfans', 'pornhub', 'xxx', 'sex', 'nude', 'adult'];
const weirdKeywords = ['weird', 'creepy', 'unusual', 'sketchy', 'strange', 'bizarre'];

function containsSuspiciousContent(content) {
  if (!content) return false; // Ensure content exists
  const lower = content.toLowerCase();
  return suspiciousLinks.some(word => lower.includes(word)) ||
         weirdKeywords.some(word => lower.includes(word));
}

let lastSeenCommitSha = null;

async function fetchLatestGitHubActivity(username) {
  console.log(`Workspaceing GitHub activity for ${username}...`);
  try {
    // Using built-in fetch (requires Node 18+)
    const res = await fetch(`https://api.github.com/users/${username}/events/public`);
    if (!res.ok) {
      // Log detailed error for GitHub API issues
      console.error(`GitHub API error: ${res.status} ${res.statusText}`);
      const errorBody = await res.text();
      console.error(`GitHub API Response: ${errorBody}`);
      return []; // Return empty on error instead of throwing to keep bot alive
    }
    const events = await res.json();

    const commits = events
      .filter(e => e.type === "PushEvent")
      .flatMap(e => e.payload.commits ? e.payload.commits.map(commit => ({ // Check if commits exist
        repo: e.repo.name,
        sha: commit.sha,
        message: commit.message,
        author: commit.author.name,
        url: `https://github.com/${e.repo.name}/commit/${commit.sha}`
      })) : []); // Handle cases where payload.commits might be missing

    const newCommits = [];
    let foundLastSeen = false;

    // Iterate backwards through fetched commits to find the new ones correctly
    for (let i = commits.length - 1; i >= 0; i--) {
      const commit = commits[i];
      if (commit.sha === lastSeenCommitSha) {
        foundLastSeen = true;
        break; // Stop when we find the last seen commit
      }
      // Add commits that are newer than the last seen one
      newCommits.unshift(commit); // Add to the beginning to maintain order
    }

    // If lastSeenCommitSha was never seen (e.g. first run or SHA expired from history)
    // And we have commits, update lastSeenCommitSha to the newest one we fetched
    if (!foundLastSeen && commits.length > 0) {
        lastSeenCommitSha = commits[0].sha; // Update to the latest commit's SHA
        // Limit announcement flood on first run / recovery? (Optional)
        // Consider only announcing the very latest commit if newCommits is large
        // if (newCommits.length > 5) {
        //   console.log(`Found ${newCommits.length} new commits on recovery/first run, announcing only the latest.`);
        //   newCommits.splice(0, newCommits.length - 1); // Keep only the last one
        // }

    } else if (newCommits.length > 0) {
        // If we found new commits normally, update lastSeenSha to the newest one
        lastSeenCommitSha = newCommits[newCommits.length - 1].sha; // Sha of the latest new commit
    }


    if (newCommits.length > 0) {
        console.log(`Found ${newCommits.length} new commits.`);
        return newCommits; // Return newest first in the array
    }

    // console.log("No new commits found."); // Less verbose logging
    return [];
  } catch (err) {
    // Catch errors during fetch/processing
    console.error("GitHub activity processing failed:", err);
    return []; // Return empty array on failure
  }
}

// Bot ready handler
bot.on("ready", () => {
  console.log(`✅ Logged in as ${bot.user.username}`);
  console.log("Setting up GitHub polling interval (15 minutes).");

  // Define the polling function separately for clarity
  const pollGitHub = async () => {
    const announceChannel = process.env.ANNOUNCE_CHANNEL_ID;
    if (!announceChannel) {
      console.error("ANNOUNCE_CHANNEL_ID is not set in .env file! GitHub polling stopped.");
      // Optionally stop the interval if channel ID is missing
      // clearInterval(githubInterval);
      return;
    }
    const newCommits = await fetchLatestGitHubActivity("artistxoder");
    for (const commit of newCommits) {
      // Ensure message isn't too long for Discord
      let commitMessage = commit.message.split('\n')[0]; // Use only first line of commit message
      if (commitMessage.length > 100) {
          commitMessage = commitMessage.substring(0, 97) + "..."; // Truncate long commit messages
      }
      const msg = `🚀 New commit in **${commit.repo}** by *${commit.author}*:\n> ${commitMessage}\n${commit.url}`;
      if (msg.length > 2000) {
          console.error("Generated commit message exceeds Discord's 2000 character limit.");
          continue; // Skip sending this message
      }
      try {
        await bot.createMessage(announceChannel, msg);
      } catch (err) {
        console.error(`Failed to send commit message to channel ${announceChannel}:`, err);
        // Log specific Discord API errors if possible (e.g., missing permissions)
        if (err.code) {
            console.error(`Discord API Error Code: ${err.code}`);
        }
      }
    }
  };

  // Run once immediately on ready, then set interval
  // Add a short delay before first poll to ensure bot is fully ready
  setTimeout(pollGitHub, 5000); // Poll 5 seconds after ready
  const githubInterval = setInterval(pollGitHub, 15 * 60 * 1000); // 15 mins
});

// Message handler
bot.on("messageCreate", async (msg) => {
  // Ignore bots and potentially null/empty messages
  if (!msg || !msg.author || msg.author.bot || !msg.content) return;

  if (containsSuspiciousContent(msg.content)) {
    console.log(`Suspicious content detected from ${msg.author.username} in channel ${msg.channel.id}`);
    try {
      await bot.createMessage(msg.channel.id, "Get a job at McDonald's!");
    } catch (err) {
      console.error(`Failed to send suspicious content reply to channel ${msg.channel.id}:`, err);
      if (err.code) {
          console.error(`Discord API Error Code: ${err.code}`); // e.g., 50013 Missing Permissions
      }
    }
  }
});

// Bot error handling
bot.on('error', (err, id) => {
  console.error(`Bot encountered an error (Shard ${id || 'N/A'}):`, err);
});

// Global error handling
process.on('uncaughtException', (err, origin) => {
  console.error(`UNCAUGHT EXCEPTION AT: ${origin}`, err);
  // Consider if you should exit on critical uncaught exceptions
  // process.exit(1); // Uncomment to exit on any uncaught exception
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION:', reason);
  // console.error('Promise:', promise); // Uncomment for more detailed promise info
});

// Connect the bot
console.log("Attempting bot connection to Discord...");
bot.connect()
  .then(() => {
    console.log("Bot connection successful (event listeners active).");
  })
  .catch((err) => {
    console.error("Bot failed to connect:", err);
    // Critical connection error, likely exit needed if it can't connect initially
    process.exit(1);
  });