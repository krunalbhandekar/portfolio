"use client";

import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, LoaderCircle, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useDeleteResource,
  usePublishResource,
  useResourceItem,
  useSaveResource,
} from "@/lib/admin/resource-api";
import { useConfirm } from "../kit/confirm-dialog";
import { PageHeader, StatusPill } from "../kit/layout";
import { useUnsavedChangesWarning } from "../kit/use-unsaved-changes";
import { handleSaveError, toFormValues } from "./form-utils";
import type { ResourceConfig } from "./types";

/** Create (`id === "new"`) or edit one item of a resource. */
export function ResourceEditor({ config, id }: { config: ResourceConfig; id: string }) {
  const router = useRouter();
  const confirm = useConfirm();
  const isNew = id === "new";
  const item = useResourceItem(config.apiPath, isNew ? null : id);
  const save = useSaveResource(config.apiPath);
  const remove = useDeleteResource(config.apiPath);
  const publish = usePublishResource(config.apiPath);

  const form = useForm({ defaultValues: config.defaults, mode: "onSubmit" });
  const { isDirty, isSubmitting } = form.formState;
  useUnsavedChangesWarning(isDirty && !isSubmitting);

  useEffect(() => {
    if (item.data) form.reset(toFormValues(config.defaults, item.data));
  }, [item.data, config.defaults, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const saved = await save.mutateAsync({ id: isNew ? null : id, values });
      form.reset(toFormValues(config.defaults, saved));
      toast.success(isNew ? `${config.singular} created as a draft` : "Changes saved");
      if (isNew) router.replace(`/admin/${config.key}/${saved._id}`);
    } catch (error) {
      handleSaveError(error, form.setError);
    }
  });

  const onDelete = async () => {
    const ok = await confirm({
      title: `Delete this ${config.singular.toLowerCase()}?`,
      description: "This can't be undone.",
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    remove.mutate(id, {
      onSuccess: () => {
        toast.success(`${config.singular} deleted`);
        form.reset();
        router.replace(`/admin/${config.key}`);
      },
      onError: (err) => toast.error("Couldn't delete", { description: err.message }),
    });
  };

  const onTogglePublish = () => {
    if (isDirty) {
      toast.warning("Save your changes first");
      return;
    }
    publish.mutate(
      { id, publish: item.data?.status !== "published" },
      {
        onSuccess: (saved) =>
          toast.success(
            saved.status === "published" ? "Published — live on the site" : "Moved to drafts",
          ),
        onError: (err) => toast.error("Couldn't change status", { description: err.message }),
      },
    );
  };

  if (!isNew && item.isPending) {
    return (
      <div className="mx-auto flex max-w-4xl flex-col gap-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (!isNew && item.isError) {
    return <p className="mx-auto max-w-4xl text-sm text-destructive">{item.error.message}</p>;
  }

  const label = isNew
    ? `New ${config.singular.toLowerCase()}`
    : String(item.data?.[config.labelField] || config.singular);
  const published = item.data?.status === "published";

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="mx-auto flex max-w-4xl flex-col gap-6" noValidate>
        <Link
          href={`/admin/${config.key}`}
          className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" /> {config.title}
        </Link>
        <PageHeader
          eyebrow={
            <span className="flex items-center gap-2">
              {config.singular} {!isNew ? <StatusPill status={item.data?.status} /> : null}
            </span>
          }
          title={label}
          actions={
            <>
              {!isNew ? (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={onDelete}
                    disabled={remove.isPending}
                  >
                    <Trash2 aria-hidden="true" /> Delete
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onTogglePublish}
                    disabled={publish.isPending}
                  >
                    {published ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                    {published ? "Unpublish" : "Publish"}
                  </Button>
                </>
              ) : null}
              <Button type="submit" disabled={isSubmitting || (!isNew && !isDirty)}>
                {isSubmitting ? (
                  <LoaderCircle className="animate-spin" aria-hidden="true" />
                ) : (
                  <Save aria-hidden="true" />
                )}
                {isNew ? "Create draft" : "Save"}
              </Button>
            </>
          }
        />
        <config.Fields />
        <div className="sticky bottom-0 -mx-4 flex justify-end gap-2 border-t bg-background/85 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
          {isDirty ? (
            <span className="mr-auto self-center text-xs text-muted-foreground">
              Unsaved changes
            </span>
          ) : null}
          <Button type="submit" disabled={isSubmitting || (!isNew && !isDirty)}>
            {isSubmitting ? (
              <LoaderCircle className="animate-spin" aria-hidden="true" />
            ) : (
              <Save aria-hidden="true" />
            )}
            {isNew ? "Create draft" : "Save"}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
