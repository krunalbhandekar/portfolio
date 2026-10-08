import { Suspense } from "react";
import { RouteSkeleton } from "@/components/admin/resources/route-skeleton";
import { ResourceEditorRoute } from "@/components/admin/resources/routes";

export default function ResourceEditorPage({ params }: PageProps<"/admin/[resource]/[id]">) {
  return (
    <Suspense fallback={<RouteSkeleton />}>
      <ResourceEditorRoute params={params} />
    </Suspense>
  );
}
