"use client";

import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { LoaderCircle, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSaveSingleton, useSingleton } from "@/lib/admin/resource-api";
import { PageHeader } from "../kit/layout";
import { useUnsavedChangesWarning } from "../kit/use-unsaved-changes";
import { RevisionHistory } from "../history/revision-history";
import { handleSaveError, toFormValues } from "./form-utils";
import type { SingletonConfig } from "./types";

/** Editor for one-of-a-kind documents (site settings, homepage, about). Always live. */
export function SingletonEditor({ config }: { config: SingletonConfig }) {
  const doc = useSingleton(config.apiPath);
  const save = useSaveSingleton(config.apiPath);
  const form = useForm({ defaultValues: config.defaults });
  const { isDirty, isSubmitting } = form.formState;
  useUnsavedChangesWarning(isDirty && !isSubmitting);

  useEffect(() => {
    if (doc.data)
      form.reset(
        toFormValues(
          config.defaults,
          config.fromDocument ? config.fromDocument(doc.data) : doc.data,
        ),
      );
  }, [doc.data, config, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const saved = await save.mutateAsync(values);
      form.reset(
        toFormValues(config.defaults, config.fromDocument ? config.fromDocument(saved) : saved),
      );
      toast.success("Saved — the site will refresh shortly");
    } catch (error) {
      handleSaveError(error, form.setError);
    }
  });

  if (doc.isPending) {
    return (
      <div className="mx-auto flex max-w-4xl flex-col gap-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (doc.isError)
    return <p className="mx-auto max-w-4xl text-sm text-destructive">{doc.error.message}</p>;

  const history = (
    <RevisionHistory
      resource={config.resource ?? config.apiPath}
      documentId={doc.data?._id ? String(doc.data._id) : undefined}
      current={doc.data}
      disabled={isDirty}
      onRestored={() => void doc.refetch()}
    />
  );

  const saveButton = (
    <Button type="submit" disabled={isSubmitting || !isDirty}>
      {isSubmitting ? (
        <LoaderCircle className="animate-spin" aria-hidden="true" />
      ) : (
        <Save aria-hidden="true" />
      )}
      Save
    </Button>
  );

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="mx-auto flex max-w-4xl flex-col gap-6" noValidate>
        <PageHeader
          eyebrow="Content"
          title={config.title}
          description={config.description}
          actions={
            <>
              {history}
              {saveButton}
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
          {saveButton}
        </div>
      </form>
    </FormProvider>
  );
}
