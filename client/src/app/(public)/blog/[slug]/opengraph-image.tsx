import { getPost, getPosts, getSettings } from "@/lib/data/public";
import { OG_SIZE, renderOgImage } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Blog post share card";

export async function generateStaticParams() {
  const { items } = await getPosts();
  return items.length ? items.map((p) => ({ slug: p.slug })) : [{ slug: "__placeholder__" }];
}

export default async function PostOgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [settings, post] = await Promise.all([
    getSettings(),
    slug === "__placeholder__" ? null : getPost(slug),
  ]);
  return renderOgImage({
    eyebrow: post?.category || "Blog",
    title: post?.title ?? settings.name,
    subtitle: post?.tags.length
      ? post.tags
          .slice(0, 5)
          .map((t) => `#${t}`)
          .join("  ")
      : post?.excerpt,
    footer: `${settings.name} — ${settings.role}`,
    accent: settings.accentColor || "#34d399",
  });
}
