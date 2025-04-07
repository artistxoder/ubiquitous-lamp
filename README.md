# ArtistXoder App

This is a Discord bot built using the `eris` library in JavaScript. It has several features, including basic moderation and integration with GitHub.

## Features

* **Suspicious Content Detection:** Monitors messages for potentially suspicious links and keywords and responds with a friendly reminder.
* **GitHub Commit Announcements:** Polls a specified GitHub user's public activity and announces new commits to a designated Discord channel.

## Installation

1.  **Clone the repository** to your local machine:
    ```bash
    git clone <repository-url>
    ```
    *(Replace `<repository-url>` with the URL of your GitHub repository)*

2.  **Navigate to the project directory:**
    ```bash
    cd your-discord-bot
    ```
    *(Replace `your-discord-bot` with the name of your project directory)*

3.  **Install the required dependencies:**
    Using npm:
    ```bash
    npm install
    ```
    Or using Yarn:
    ```bash
    yarn install
    ```

4.  **Create a `.env` file** in the root of your project directory.

5.  **Add the following environment variables to your `.env` file:**
    ```
    TOKEN=YOUR_DISCORD_BOT_TOKEN
    ANNOUNCE_CHANNEL_ID=YOUR_DISCORD_CHANNEL_ID
    ```
    * `YOUR_DISCORD_BOT_TOKEN`: Replace this with your Discord bot's token. You can get this from the Discord Developer Portal.
    * `YOUR_DISCORD_CHANNEL_ID`: Replace this with the ID of the Discord channel where you want the bot to announce new GitHub commits. You can usually get this by enabling Developer Mode in Discord (Settings -> Advanced) and then right-clicking on the channel and selecting "Copy ID".

## Usage

To start the bot, run the following command in your terminal from the project directory:

Using npm:
```bash
npm start
