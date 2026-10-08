import { Suspense } from "react";
import { RouteSkeleton } from "@/components/admin/resources/route-skeleton";
import { ResourceListRoute } from "@/components/admin/resources/routes";

export default function ResourceListPage({ params }: PageProps<"/admin/[resource]">) {
  return (
    <Suspense fallback={<RouteSkeleton />}>
      <ResourceListRoute params={params} />
    </Suspense>
  );
}
