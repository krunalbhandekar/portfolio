import type { Metadata } from "next";
import { SectionHeader } from "@/components/shared/section-header";
import { WriteTestimonial } from "@/components/testimonials/write-testimonial";
import { getSettings } from "@/lib/data/public";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return pageMetadata({
    title: "Leave a testimonial",
    description: `Worked with ${settings.name}? Share your experience in a short testimonial.`,
    path: "/testimonials/write",
    settings,
    // A form, not content: shareable, but kept out of search results and the sitemap.
    noindex: true,
  });
}

export default async function WriteTestimonialPage() {
  const settings = await getSettings();
  return (
    <div className="container-page grid gap-12 py-16 lg:grid-cols-[1fr_1.4fr]">
      <SectionHeader
        as="h1"
        eyebrow="Testimonial"
        title={`Worked with ${settings.name.split(" ")[0] || "me"}?`}
        description="I'd really appreciate a few words about the experience. It takes a couple of minutes, and it's published once I've reviewed it."
      />
      <WriteTestimonial ownerName={settings.name} />
    </div>
  );
}
