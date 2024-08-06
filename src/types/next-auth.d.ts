import type { User } from 'next-auth';
import type { AdapterUser } from 'next-auth/adapters';

declare module 'next-auth' {
  interface User {
    isJoinedGuild?: boolean;
    isJoinedOrganization?: boolean;
    githubUserID?: number;
    githubUserName?: string;
    discordUserID?: string;
    googleUserID?: string;
  }
}

declare module 'next-auth/adapters' {
  interface AdapterUser extends User {}
}
