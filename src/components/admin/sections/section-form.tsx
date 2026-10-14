"use client";

import { useMemo, useState, useTransition } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { SchemaFormFields } from "@/components/admin/form/schema-form-fields";
import { SaveBar } from "@/components/admin/form/save-bar";
import { useActionForm } from "@/components/admin/form/use-action-form";
import { Button } from "@/components/admin/ui/button";
import { Switch } from "@/components/admin/ui/switch";
import { describeObject } from "@/lib/content/form-meta";
import { pageContentSchemas, type PageContentKey } from "@/lib/content/schemas";
import type { MediaListItem } from "@/lib/media/admin-types";
import { saveSection, setSectionPublished } from "@/server/actions/sections";

export function SectionForm({
  contentKey,
  initialData,
  published: initialPublished,
  previewHref,
  mediaPreviews,
}: {
  contentKey: PageContentKey;
  initialData: Record<string, unknown>;
  published: boolean;
  previewHref: string;
  mediaPreviews: Record<string, MediaListItem>;
}) {
  const schema = pageContentSchemas[contentKey];
  const fields = useMemo(() => describeObject(schema), [schema]);
  const form = useForm({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- schema varies per key
    resolver: zodResolver(schema as any),
    defaultValues: initialData,
  });
  const { submit, pending } = useActionForm(form, (values) => saveSection(contentKey, values));
  const [toggling, startToggle] = useTransition();
  const [published, setPublished] = useState(initialPublished);

  return (
    <FormProvider {...form}>
      <form onSubmit={submit} className="space-y-6" noValidate>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-4">
          <label className="flex items-center gap-3 text-sm">
            <Switch
              checked={published}
              disabled={toggling}
              onCheckedChange={(v) =>
                startToggle(async () => {
                  const res = await setSectionPublished(contentKey, v);
                  if (res.ok) {
                    setPublished(v);
                    toast.success(res.message);
                  } else toast.error(res.error);
                })
              }
            />
            {published ? "Visible en el sitio" : "Oculta en el sitio"}
          </label>
          <Button variant="outline" size="sm" asChild>
            <a href={previewHref} target="_blank" rel="noopener">
              <ExternalLink />
              Ver en el sitio
            </a>
          </Button>
        </div>

        <div className="rounded-lg border bg-card p-4 sm:p-6">
          <SchemaFormFields fields={fields} mediaPreviews={mediaPreviews} />
        </div>

        <SaveBar pending={pending} dirty={form.formState.isDirty} onDiscard={() => form.reset()} />
      </form>
    </FormProvider>
  );
}
