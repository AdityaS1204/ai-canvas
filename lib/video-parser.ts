export interface ParsedVideo {
  kind: 'iframe' | 'direct';
  embedUrl: string;
  platform: 'youtube' | 'pinterest' | 'vimeo' | 'cloudinary' | 'direct';
  titleFallback: string;
}

export function parseVideoUrl(rawUrl: string): ParsedVideo {
  const url = (rawUrl || '').trim();

  // 1. YouTube: standard watch, youtu.be, shorts, embed
  const ytMatch = url.match(
    /(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch && ytMatch[1]) {
    return {
      kind: 'iframe',
      embedUrl: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?rel=0&modestbranding=1`,
      platform: 'youtube',
      titleFallback: 'YouTube Video',
    };
  }

  // 2. Pinterest: pinterest.com/pin/<id>
  const pinMatch = url.match(/pinterest\.[a-z.]+\/pin\/(\d+)/i);
  if (pinMatch && pinMatch[1]) {
    return {
      kind: 'iframe',
      embedUrl: `https://assets.pinterest.com/ext/embed.html?id=${pinMatch[1]}`,
      platform: 'pinterest',
      titleFallback: 'Pinterest Pin',
    };
  }

  // 3. Vimeo: vimeo.com/<id>
  const vimeoMatch = url.match(/(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)/);
  if (vimeoMatch && (vimeoMatch[3] || vimeoMatch[1])) {
    const id = vimeoMatch[3] || vimeoMatch[1];
    return {
      kind: 'iframe',
      embedUrl: `https://player.vimeo.com/video/${id}?dnt=1`,
      platform: 'vimeo',
      titleFallback: 'Vimeo Video',
    };
  }

  // 4. Cloudinary or Direct MP4/WebM video file
  const isCloudinary = url.includes('cloudinary.com');
  return {
    kind: 'direct',
    embedUrl: url,
    platform: isCloudinary ? 'cloudinary' : 'direct',
    titleFallback: isCloudinary ? 'Cloudinary Video' : 'Video',
  };
}

