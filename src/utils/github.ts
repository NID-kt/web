const createGitHubApiHeaders = (accessToken: string) => {
  return {
    Accept: 'application/vnd.github.v3+json',
    Authorization: `Bearer ${accessToken}`,
    'X-GitHub-Api-Version': '2022-11-28',
  };
};

export const isJoinedOrganization = async (
  accessToken: string,
  username: string,
) => {
  const response = await fetch(
    `https://api.github.com/orgs/NID-roid/members/${username}`,
    {
      headers: createGitHubApiHeaders(accessToken),
    },
  );
  return response.status === 204;
};

export const createOrganizationInvitation = async (
  accessToken: string,
  userID: number,
) => {
  const response = await fetch(
    'https://api.github.com/orgs/NID-roid/invitations',
    {
      method: 'POST',
      headers: createGitHubApiHeaders(accessToken),
      body: JSON.stringify({
        invitee_id: userID,
      }),
    },
  );
  return response.status === 201;
};
