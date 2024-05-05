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
