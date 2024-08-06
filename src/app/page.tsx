import { auth, signIn, signOut } from '@/auth';
import { createOrganizationInvitation } from '@/utils/github';

const ButtonInForm = ({
  action,
  text,
}: {
  action: () => void;
  text: string;
}) => (
  <form action={action}>
    <button
      type='submit'
      className='px-8 py-4 mt-8 text-lg font-semibold border border-gray-300 rounded-lg transition-colors hover:border-gray-400'
    >
      {text}
    </button>
  </form>
);

const SignInButton = ({
  service,
  text,
}: {
  service: 'discord' | 'github' | 'google';
  text: string;
}) => (
  <ButtonInForm
    action={async () => {
      'use server';
      await signIn(service);
    }}
    text={text}
  />
);

const DiscordLink = () => (
  <a
    href='https://discord.gg/nid-kt'
    className='px-8 py-4 mt-8 text-lg font-semibold border border-gray-300 rounded-lg transition-colors hover:border-gray-400'
  >
    Join NID.kt Discord Server!
  </a>
);

export default async function Home() {
  const session = await auth();

  if (!session) {
    return (
      <main className='flex min-h-screen flex-col items-center justify-center p-24'>
        <SignInButton service='discord' text='Sign in with Discord' />
      </main>
    );
  }

  const {
    isJoinedGuild,
    githubUserID,
    googleUserID,
    isJoinedOrganization,
    name,
  } = session.user || {};

  return (
    <main className='flex min-h-screen flex-col items-center justify-center p-24'>
      <p className='text-2xl font-semibold'>Welcome {name}</p>

      {!isJoinedGuild ? (
        <DiscordLink />
      ) : !githubUserID ? (
        <SignInButton service='github' text='Sign in with GitHub' />
      ) : !isJoinedOrganization ? (
        <ButtonInForm
          action={async () => {
            'use server';
            await createOrganizationInvitation(githubUserID);
          }}
          text='Join NID-kt Organization!'
        />
      ) : (
        <></>
      )}

      {isJoinedGuild && !googleUserID && (
        <SignInButton service='google' text='Sign in with Google' />
      )}

      <SignInButton service='discord' text='Update Discord Profile' />
      {githubUserID && (
        <SignInButton service='github' text='Update GitHub Profile' />
      )}
      {googleUserID && (
        <SignInButton service='google' text='Update Google Profile' />
      )}
      <ButtonInForm
        action={async () => {
          'use server';
          await signOut();
        }}
        text='Sign out'
      />
    </main>
  );
}
