/** @type {import('next').NextConfig} */
const nextConfig = {
  redirects: () => {
    return [
      {
        source: '/',
        has: [{ type: 'host', value: 'discord.nidkt.org' }],
        destination: 'https://discord.gg/nid-kt',
        permanent: true,
      },
      {
        source: '/invite',
        has: [{ type: 'host', value: 'discord.nidkt.org' }],
        destination: 'https://discord.gg/nid-kt',
        permanent: true,
      },
      {
        source: '/event/lt-vol-3',
        has: [{ type: 'host', value: 'discord.nidkt.org' }],
        destination: 'https://discord.gg/nid-kt?event=1260990331193917541',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
