"use client";

import { useState } from "react";
import { Play } from "lucide-react";

/** YouTube / Loom click-to-load facade: no third-party JS until the visitor asks for it. */
function parse(url: string) {
  const youtube = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/,
  );
  if (youtube) {
    return {
      embed: `https://www.youtube-nocookie.com/embed/${youtube[1]}?autoplay=1`,
      poster: `https://i.ytimg.com/vi/${youtube[1]}/hqdefault.jpg`,
    };
  }
  const loom = url.match(/loom\.com\/(?:share|embed)\/([\w]+)/);
  if (loom) return { embed: `https://www.loom.com/embed/${loom[1]}?autoplay=1`, poster: null };
  return null;
}

export function VideoEmbed({ url, title }: { url: string; title: string }) {
  const [playing, setPlaying] = useState(false);
  const video = parse(url);
  if (!video) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-brand-text underline"
      >
        Watch the demo video
      </a>
    );
  }
  return (
    <div className="relative aspect-video overflow-hidden rounded-2xl border bg-muted">
      {playing ? (
        <iframe
          src={video.embed}
          title={`${title} — demo video`}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          className="absolute inset-0 size-full"
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="group absolute inset-0 flex items-center justify-center"
          aria-label={`Play ${title} demo video`}
        >
          {video.poster ? (
            // eslint-disable-next-line @next/next/no-img-element -- third-party poster, not worth optimising
            <img
              src={video.poster}
              alt=""
              loading="lazy"
              className="absolute inset-0 size-full object-cover opacity-80"
            />
          ) : null}
          <span className="relative flex size-16 items-center justify-center rounded-full bg-background/90 shadow-lg transition-transform group-hover:scale-105">
            <Play className="ml-1 size-6" aria-hidden="true" />
          </span>
        </button>
      )}
    </div>
  );
}
