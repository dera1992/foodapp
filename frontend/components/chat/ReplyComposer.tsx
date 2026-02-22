'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';

export function ReplyComposer() {
  const [value, setValue] = useState('');
  return (
    <div className="rounded-2xl border border-brand-border bg-white p-4">
      <Textarea value={value} onChange={(e) => setValue(e.target.value)} placeholder="Write your reply" />
      <div className="mt-3 flex justify-end">
        <Button type="button">Send reply</Button>
      </div>
    </div>
  );
}
