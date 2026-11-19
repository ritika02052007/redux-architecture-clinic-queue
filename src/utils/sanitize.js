// Strips script blocks, tags, inline handlers and javascript: URLs, then trims.
export const sanitize = (value = '') =>
  String(value)
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/[<>]/g, '')
    .trim();
