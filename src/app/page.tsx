import { auth, signIn, signOut } from '@/auth';

export default async function Home() {
  const session = await auth();

  if (!session) {
    return (
      <main className='flex min-h-screen flex-col items-center justify-center p-24'>
        <form
          action={async () => {
            'use server';
            await signIn('discord');
          }}
        >
          <button
            type='submit'
            className='px-8 py-4 text-lg font-semibold border border-gray-300 rounded-lg transition-colors hover:border-gray-400'
          >
            Sign in with Discord
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className='flex min-h-screen flex-col items-center justify-center p-24'>
      <p className='text-2xl font-semibold'>Welcome {session.user?.name}</p>
      <form
        action={async () => {
          'use server';
          await signOut();
        }}
      >
        <button
          type='submit'
          className='px-8 py-4 mt-8 text-lg font-semibold border border-gray-300 rounded-lg transition-colors hover:border-gray-400'
        >
          Sign out
        </button>
      </form>
    </main>
  );
}
