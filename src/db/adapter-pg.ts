import { default as OriginalPostgresAdapter } from '@auth/pg-adapter';
import type { Pool } from '@neondatabase/serverless';
import type { Adapter, AdapterAccount } from 'next-auth/adapters';

// biome-ignore lint:noExplicitAny - This is a type from the database
export function mapExpiresAt(account: any): AdapterAccount {
  const expires_at: number = Number.parseInt(account.expires_at);
  return {
    ...account,
    expires_at,
  };
}

export default function PostgresAdapter(client: Pool): Adapter {
  return {
    ...OriginalPostgresAdapter(client),
    async createUser(user) {
      const {
        name,
        email,
        emailVerified,
        image,
        isJoinedGuild,
        isJoinedOrganization,
        githubUserID,
        githubUserName,
        discordUserID,
        googleUserID,
      } = user;
      const sql = `
          INSERT INTO users
          (
            name,
            email,
            "emailVerified",
            image,
            "isJoinedGuild",
            "isJoinedOrganization",
            "githubUserID",
            "githubUserName",
            "discordUserID",
            "googleUserID"
          ) 
          VALUES ($1, $2, $3, $4 , $5, $6, $7, $8, $9, $10) 
          RETURNING
            id,
            name,
            email,
            "emailVerified",
            image,
            "isJoinedGuild",
            "isJoinedOrganization",
            "githubUserID",
            "githubUserName",
            "discordUserID",
            "googleUserID"
        `;
      const result = await client.query(sql, [
        name,
        email,
        emailVerified,
        image,
        isJoinedGuild,
        isJoinedOrganization,
        githubUserID,
        githubUserName,
        discordUserID,
        googleUserID,
      ]);
      return result.rows[0];
    },
    async updateUser(user) {
      const fetchSql = 'select * from users where id = $1';
      const query1 = await client.query(fetchSql, [user.id]);
      const oldUser = query1.rows[0];

      const newUser = {
        ...oldUser,
        ...user,
      };

      const {
        id,
        name,
        email,
        emailVerified,
        image,
        isJoinedGuild,
        isJoinedOrganization,
        githubUserID,
        githubUserName,
        discordUserID,
        googleUserID,
      } = newUser;

      const updateSql = `
          UPDATE users set
            name = $2,
            email = $3,
            "emailVerified" = $4,
            image = $5,
            "isJoinedGuild" = $6,
            "isJoinedOrganization" = $7,
            "githubUserID" = $8,
            "githubUserName" = $9,
            "discordUserID" = $10,
            "googleUserID" = $11
          where id = $1
          RETURNING
            name,
            id,
            email,
            "emailVerified",
            image,
            "isJoinedGuild",
            "isJoinedOrganization",
            "githubUserID",
            "githubUserName",
            "discordUserID",
            "googleUserID"
        `;
      const query2 = await client.query(updateSql, [
        id,
        name,
        email,
        emailVerified,
        image,
        isJoinedGuild,
        isJoinedOrganization,
        githubUserID,
        githubUserName,
        discordUserID,
        googleUserID,
      ]);
      return query2.rows[0];
    },
    async linkAccount(account) {
      const exists = await client.query(
        `SELECT EXISTS (
        SELECT 1
        FROM accounts
        WHERE "userId" = $1 AND provider = $2 AND "providerAccountId" = $3
      );`,
        [account.userId, account.provider, account.providerAccountId],
      );

      let sql: string;
      if (exists.rows[0].exists) {
        sql = `
          update accounts set
            type = $3,
            access_token = $5,
            expires_at = $6,
            refresh_token = $7,
            id_token = $8,
            scope = $9,
            session_state = $10,
            token_type = $11
          where "userId" = $1 AND provider = $2 AND "providerAccountId" = $4
          returning
            id,
            "userId", 
            provider, 
            type, 
            "providerAccountId", 
            access_token,
            expires_at,
            refresh_token,
            id_token,
            scope,
            session_state,
            token_type
        `;
      } else {
        sql = `
          insert into accounts 
          (
            "userId", 
            provider, 
            type, 
            "providerAccountId", 
            access_token,
            expires_at,
            refresh_token,
            id_token,
            scope,
            session_state,
            token_type
          )
          values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          returning
            id,
            "userId", 
            provider, 
            type, 
            "providerAccountId", 
            access_token,
            expires_at,
            refresh_token,
            id_token,
            scope,
            session_state,
            token_type
          `;
      }

      const params = [
        account.userId,
        account.provider,
        account.type,
        account.providerAccountId,
        account.access_token,
        account.expires_at,
        account.refresh_token,
        account.id_token,
        account.scope,
        account.session_state,
        account.token_type,
      ];

      const result = await client.query(sql, params);
      return mapExpiresAt(result.rows[0]);
    },
  };
}
