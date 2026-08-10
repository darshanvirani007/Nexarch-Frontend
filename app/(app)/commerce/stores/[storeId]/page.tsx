import { CommerceStoreDetailPage } from "@/components/commerce-tracking";

export default async function Page({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  return <CommerceStoreDetailPage storeId={storeId} />;
}
