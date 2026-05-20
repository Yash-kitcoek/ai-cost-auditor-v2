// app/audit/[id]/page.tsx
import { redirect } from 'next/navigation';
export default function AuditPage({ params }: { params: { id: string } }) {
  redirect(`/reaudit/${params.id}`);
}