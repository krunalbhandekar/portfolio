"use client";

import { useWatch } from "react-hook-form";
import { slugify } from "@/lib/slug";
import { DateField, SwitchField, TagsField, TextField, TextareaField } from "../kit/fields";
import { FormSection } from "../kit/layout";
import { RichTextField } from "../kit/rich-text-field";
import { MediaField } from "../media/media-fields";
import type { ResourceConfig } from "../resources/types";
import { useSkillSuggestions } from "./use-skill-suggestions";

const formatDate = (value: unknown) =>
  value
    ? new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(
        new Date(String(value)),
      )
    : "—";

/** Tags: lower-case; a skill's slug (e.g. "node-js") also lists the post on that skill's page. */
const normalizeTag = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9 .+#-]/g, "")
    .slice(0, 30);

function PostFields() {
  const title = useWatch({ name: "title" }) as string;
  const skills = useSkillSuggestions();
  return (
    <>
      <FormSection title="Post">
        <TextField name="title" label="Title" required wide />
        <TextField
          name="slug"
          label="URL slug"
          placeholder={slugify(title || "") || "my-post"}
          description="Generated from the title if empty. Changing it later breaks old links."
        />
        <TextField name="category" label="Category" placeholder="Databases" />
        <TextareaField
          name="excerpt"
          label="Excerpt"
          required
          maxLength={300}
          description="Shown on cards, in search results and in the RSS feed."
          wide
        />
        <TagsField
          name="tags"
          label="Tags"
          suggestions={skills}
          normalize={normalizeTag}
          placeholder="mongodb, system-design…"
          description="Up to 10. Pick a skill to list this post on its /skills page."
          wide
        />
        <MediaField name="coverImage" label="Cover image" folder="portfolio/blog" wide />
      </FormSection>

      <FormSection
        title="Content"
        description="Use the image and paperclip buttons to insert pictures or PDFs from the Media Library, and the code-block button for code (pick its language). H2 headings build the table of contents."
      >
        <RichTextField name="content" label="Body" mediaFolder="portfolio/blog" />
      </FormSection>

      <FormSection title="Publishing">
        <DateField
          name="publishedAt"
          label="Published on"
          description="Set automatically on first publish; change it to back-date an imported post."
        />
        <TextField
          name="crossPostUrl"
          label="Cross-post link"
          type="url"
          placeholder="https://www.linkedin.com/pulse/…"
          description="Optional: where else this post is published (LinkedIn, dev.to…)."
        />
      </FormSection>

      <FormSection title="SEO">
        <TextField name="seo.title" label="Meta title" maxLength={70} wide />
        <TextareaField name="seo.description" label="Meta description" maxLength={160} wide />
        <SwitchField name="seo.noindex" label="Hide from search engines and RSS" wide />
      </FormSection>
    </>
  );
}

export const blogConfig: ResourceConfig = {
  key: "blog",
  apiPath: "posts",
  title: "Blog",
  singular: "Post",
  description: "Technical articles with code highlighting, tags and an RSS feed.",
  labelField: "title",
  previewPath: (doc) => (doc.slug ? `/blog/${String(doc.slug)}` : null),
  columns: [
    { header: "Title", sortKey: "title", cell: (d) => String(d.title) },
    {
      header: "Category",
      sortKey: "category",
      cell: (d) => String(d.category || "—"),
      className: "hidden md:table-cell",
    },
    {
      header: "Published",
      sortKey: "publishedAt",
      cell: (d) => <span className="font-mono text-xs">{formatDate(d.publishedAt)}</span>,
      className: "hidden sm:table-cell",
    },
    {
      header: "Read",
      cell: (d) => <span className="font-mono text-xs">{String(d.readingTime ?? 1)} min</span>,
      className: "hidden lg:table-cell",
    },
  ],
  defaults: {
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    coverImage: null,
    category: "",
    tags: [],
    publishedAt: null,
    crossPostUrl: "",
    seo: { title: "", description: "", noindex: false },
  },
  Fields: PostFields,
};
