"use client";

import { useParams } from "next/navigation";
import { SizeEditor, SizeEditorHeader } from "@/components/admin/products/SizeEditor";

export default function DashboardSizeEditPage() {
  const params = useParams<{ name: string }>();
  const displayName = decodeURIComponent(params.name);

  return (
    <div className="flex flex-col gap-6">
      <SizeEditorHeader displayName={displayName} />
      <SizeEditor displayName={displayName} />
    </div>
  );
}
