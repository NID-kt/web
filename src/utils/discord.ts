export const isJoinedGuild = async (accessToken: string) => {
  const response = await fetch(
    `https://discordapp.com/api/users/@me/guilds?after=${process.env.DISCORD_GUILD_ID_PREV}&limit=1`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );
  const json = (await response.json()) as { id: string }[];
  return json.some((guild) => guild.id === process.env.DISCORD_GUILD_ID);
};

export const createDirectMessageChannel = async (userID: string) => {
  const response = await fetch(
    'https://discord.com/api/v10/users/@me/channels',
    {
      method: 'POST',
      headers: {
        Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipient_id: userID,
      }),
    },
  );

  const json = await response.json();
  return json.id;
};

export const sendMessage = ({
  channelID,
  message,
}: { channelID: string; message: string }) => {
  return fetch(`https://discord.com/api/v10/channels/${channelID}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      content: message,
    }),
  });
};

export const sendDirectMessage = async ({
  userID,
  message,
}: {
  userID: string;
  message: string;
}) => {
  const channelID = await createDirectMessageChannel(userID);
  return await sendMessage({ channelID, message });
};
