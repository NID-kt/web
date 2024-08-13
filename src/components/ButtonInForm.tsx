export default function ButtonInForm({
  action,
  text,
}: {
  action: JSX.IntrinsicElements['form']['action'];
  text: string;
}) {
  return (
    <form action={action}>
      <button
        type='submit'
        className='px-8 py-4 mt-8 text-lg font-semibold border border-gray-300 rounded-lg transition-colors hover:border-gray-400'
      >
        {text}
      </button>
    </form>
  );
}
