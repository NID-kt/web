const createGitHubApiHeaders = () => {
  return {
    Accept: 'application/vnd.github.v3+json',
    Authorization: `Bearer ${process.env.GITHUB_ACCESS_TOKEN}`,
    'X-GitHub-Api-Version': '2022-11-28',
  };
};

export const isJoinedOrganization = async (username: string) => {
  const response = await fetch(
    `https://api.github.com/orgs/NID-roid/members/${username}`,
    {
      headers: createGitHubApiHeaders(),
    },
  );
  return response.status === 204;
};

export const createOrganizationInvitation = async (userID: number) => {
  const response = await fetch(
    'https://api.github.com/orgs/NID-roid/invitations',
    {
      method: 'POST',
      headers: createGitHubApiHeaders(),
      body: JSON.stringify({
        invitee_id: userID,
      }),
    },
  );
  return response.status === 201;
};
