
/**
 * A simple in-memory cache for storing cloned page content.
 * In a real production environment with multiple server instances, this should be
 * replaced with a distributed cache like Redis or Memcached.
 */
export const pageCache = new Map<string, string>();
