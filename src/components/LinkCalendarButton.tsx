'use client';

import { linkCalendar, unlinkCalendar } from '@/utils/calendar';
import { useFormState } from 'react-dom';
import ButtonInForm from './ButtonInForm';

export default function LinkCalendarButton({
  action,
  text,
}: { action: 'link' | 'unlink'; text: string }) {
  const [state, dispatch] = useFormState(
    action === 'link' ? linkCalendar : unlinkCalendar,
    { error: '' },
  );
  return (
    <>
      <ButtonInForm action={dispatch} text={text} />
      {state.error && <p className='text-red-400 mt-2'>{state.error}</p>}
    </>
  );
}
