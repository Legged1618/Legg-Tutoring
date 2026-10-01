"use client";

import { useState } from "react";
import ArticleArt, { type ArticleArtKind } from "@/components/ArticleArt";

/**
 * A Worth a Look card image: the linked site's own preview image, falling
 * back to a drawing of the site when there isn't one or it fails to load.
 */
export default function ArticleImage({ src, art, alt }: { src: string | null; art: ArticleArtKind; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <ArticleArt kind={art} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- remote preview images from many hosts
    <img className="article-art article-photo" src={src} alt={alt} loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} />
  );
}
