import type { User } from 'next-auth';

declare module 'next-auth' {
  interface User {
    isJoinedGuild?: boolean;
    isJoinedOrganization?: boolean;
    githubUserID?: number;
  }
}
