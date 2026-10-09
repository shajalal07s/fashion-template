"use client";

import { useParams } from "next/navigation";
import { DistrictReport } from "@/components/admin/reports/DistrictReport";

export default function DistrictDetailsPage() {
  const params = useParams<{ country: string; division: string; district: string }>();
  return (
    <DistrictReport
      country={params.country}
      division={params.division}
      district={params.district}
    />
  );
}
