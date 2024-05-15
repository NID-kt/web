import type { User } from 'next-auth';

const codeBlock = '```';

export const sendAuditLog = (method: string, message: object, user: User) => {
  const formData = new FormData();

  const content = JSON.stringify({ method: method, ...user }, null, 2);
  const payload = JSON.stringify({
    content: `${codeBlock}json\n${content}\n${codeBlock}`,
    username: user.name,
    avatar_url: user.image,
    flags: 4096,
  });
  formData.append('payload_json', payload);

  const messageBlob = new Blob(
    [JSON.stringify({ method: method, ...message }, null, 2)],
    { type: 'application/json' },
  );
  formData.append('file[0]', messageBlob, 'message.json');

  // biome-ignore lint:noNonNullAssertion - We know this is defined
  return fetch(process.env.AUDIT_LOG_WEBHOOK!, {
    method: 'POST',
    body: formData,
  });
};
