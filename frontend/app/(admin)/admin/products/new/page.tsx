'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { createProduct } from '@/lib/api/endpoints';

export default function AdminNewProductPage() {
  const [message, setMessage] = useState('');

  async function handleSubmit(formData: FormData) {
    const payload = {
      name: String(formData.get('name') || ''),
      description: String(formData.get('description') || ''),
      price: Number(formData.get('price') || 0)
    };

    try {
      await createProduct(payload);
      setMessage('Product created successfully.');
    } catch {
      setMessage('Unable to create product. Check endpoint mapping.');
    }
  }

  return (
    <Card className="max-w-2xl p-6">
      <h1 className="text-2xl font-semibold">Create product</h1>
      <form action={handleSubmit} className="mt-5 space-y-4">
        <Input name="name" placeholder="Product name" required />
        <Input name="price" type="number" step="0.01" placeholder="Price" required />
        <Textarea name="description" placeholder="Description" />
        <Button type="submit">Create</Button>
      </form>
      {message ? <p className="mt-3 text-sm text-brand-muted">{message}</p> : null}
    </Card>
  );
}