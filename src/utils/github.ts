export const isJoinedOrganization = async (
  accessToken: string,
  username: string,
) => {
  const response = await fetch(
    `https://api.github.com/orgs/NID-roid/members${username}`,
    {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        Authorization: `Bearer ${accessToken}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    },
  );
  return response.status === 204;
};
