export function isPublicUrl(value) {
  return typeof value === "string" && (value.startsWith("http://") || value.startsWith("https://"));
}

export function extractYoutubeVideoId(value) {
  if (!isPublicUrl(value)) return null;

  try {
    const url = new URL(value);
    const hostname = url.hostname.replace("www.", "");

    if (hostname === "youtu.be") {
      return url.pathname.slice(1).split("/")[0] || null;
    }

    if (hostname === "youtube.com" || hostname === "m.youtube.com" || hostname === "youtube-nocookie.com") {
      const watchId = url.searchParams.get("v");
      if (watchId) return watchId;

      const parts = url.pathname.split("/").filter(Boolean);
      if (["embed", "shorts", "live"].includes(parts[0]) && parts[1]) return parts[1];
    }
  } catch {
    return null;
  }

  return null;
}

export function youtubeEmbedUrl(value) {
  const id = extractYoutubeVideoId(value);
  return id ? `https://www.youtube.com/embed/${encodeURIComponent(id)}?rel=0&playsinline=1` : null;
}

export function youtubeWatchUrl(value) {
  const id = extractYoutubeVideoId(value);
  if (id) return `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`;
  return isPublicUrl(value) ? value : null;
}
