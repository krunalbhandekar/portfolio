import mongoose from "mongoose";
import { notFound } from "../../utils/app-error.js";
import { Post } from "./post.model.js";

const PUBLISHED = { status: "published" } as const;

/** Fields for post cards (list, related, home, skill pages). */
export const POST_CARD = {
  title: 1,
  slug: 1,
  excerpt: 1,
  coverImage: 1,
  category: 1,
  tags: 1,
  readingTime: 1,
  publishedAt: 1,
  updatedAt: 1,
} as const;

// Newest first; posts published before `publishedAt` existed fall back to creation order.
const NEWEST = { publishedAt: -1, createdAt: -1 } as const;

export type PostQuery = {
  tag?: string;
  category?: string;
  q?: string;
  page: number;
  limit: number;
};

export async function getPosts({ tag, category, q, page, limit }: PostQuery) {
  const filter: Record<string, unknown> = { ...PUBLISHED };
  if (tag) filter.tags = tag.toLowerCase();
  if (category) filter.category = category;
  if (q) filter.$text = mongoose.trusted({ $search: q });

  const [items, total, tags] = await Promise.all([
    Post.find(filter, POST_CARD)
      .sort(NEWEST)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Post.countDocuments(filter),
    // Tag cloud for filters: every tag used by a published post, most used first.
    Post.aggregate<{ _id: string; count: number }>([
      { $match: PUBLISHED },
      { $unwind: "$tags" },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
    ]),
  ]);
  return {
    items,
    tags: tags.map((t) => ({ tag: t._id, count: t.count })),
    meta: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
  };
}

export async function getPost(slug: string, options: { drafts?: boolean } = {}) {
  const post = await Post.findOne(
    { ...(options.drafts ? {} : PUBLISHED), slug },
    { updatedBy: 0, __v: 0 },
  ).lean();
  if (!post) throw notFound("Post not found");

  // Related: most shared tags first, then newest; topped up with the latest posts.
  const tags = post.tags ?? [];
  const related = tags.length
    ? await Post.aggregate([
        {
          $match: {
            ...PUBLISHED,
            _id: mongoose.trusted({ $ne: post._id }),
            tags: mongoose.trusted({ $in: tags }),
          },
        },
        { $addFields: { shared: { $size: { $setIntersection: ["$tags", tags] } } } },
        { $sort: { shared: -1, publishedAt: -1 } },
        { $limit: 3 },
        { $project: POST_CARD },
      ])
    : [];
  if (related.length < 3) {
    const exclude = [post._id, ...related.map((r) => r._id)];
    related.push(
      ...(await Post.find({ ...PUBLISHED, _id: mongoose.trusted({ $nin: exclude }) }, POST_CARD)
        .sort(NEWEST)
        .limit(3 - related.length)
        .lean()),
    );
  }
  return { ...post, related };
}

export async function getLatestPosts(limit = 3) {
  return Post.find(PUBLISHED, POST_CARD).sort(NEWEST).limit(limit).lean();
}

/** Everything the RSS feed needs (full HTML so readers can show the whole article). */
export async function getFeedPosts(limit = 30) {
  return Post.find(
    { ...PUBLISHED, "seo.noindex": mongoose.trusted({ $ne: true }) },
    {
      title: 1,
      slug: 1,
      excerpt: 1,
      content: 1,
      category: 1,
      tags: 1,
      publishedAt: 1,
      updatedAt: 1,
    },
  )
    .sort(NEWEST)
    .limit(limit)
    .lean();
}
