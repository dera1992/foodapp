import { ProductEditorPage } from '@/components/admin/products/ProductEditorPage';

export default async function AdminEditProductPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProductEditorPage mode="edit" productId={id} />;
}

