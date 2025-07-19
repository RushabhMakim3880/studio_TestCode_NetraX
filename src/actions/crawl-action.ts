
'use server';

import { scanSubdomains } from './osint-actions';

export type CrawlNode = {
  name: string;
  type?: 'Login' | 'API' | 'External' | 'Page';
};

export type CrawlLink = {
  source: number;
  target: number;
  value: number;
};

export type CrawlResult = {
  nodes: CrawlNode[];
  links: CrawlLink[];
};

// Helper function to extract links from HTML content
const extractLinks = (html: string, baseUrl: string): string[] => {
  const links = new Set<string>();
  const regex = /href=["'](.*?_?https?:\/\/[^"']+|[^"':]+)["']/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    let href = match[1];

    if (href.startsWith('//')) {
      href = `https:${href}`;
    }

    try {
        const url = new URL(href, `https://${baseUrl}`);
        links.add(url.href);
    } catch(e) {
        // Ignore invalid URLs
    }
  }
  return Array.from(links);
};

// Heuristic to classify a link
const classifyLink = (link: string, baseDomain: string): CrawlNode['type'] => {
  const lowerLink = link.toLowerCase();
  const url = new URL(link);
  
  if (!url.hostname.endsWith(baseDomain)) {
      return 'External';
  }
  if (lowerLink.includes('login') || lowerLink.includes('signin') || lowerLink.includes('auth')) {
    return 'Login';
  }
  if (lowerLink.includes('/api/') || lowerLink.includes('api.')) {
    return 'API';
  }
  return 'Page';
};


export async function crawlSiteForGraph(domain: string): Promise<CrawlResult> {
  const nodes: CrawlNode[] = [{ name: 'root', type: 'Page' }];
  const links: CrawlLink[] = [];
  const nodeIndexMap = new Map<string, number>([['root', 0]]);

  try {
    // 1. Get subdomains
    const subdomains = await scanSubdomains(domain);
    const allDomains = [domain, ...subdomains.filter(sd => sd !== domain)];

    // 2. Fetch homepage of each subdomain to get initial links
    for (const d of allDomains) {
      if (!nodeIndexMap.has(d)) {
        nodeIndexMap.set(d, nodes.length);
        nodes.push({ name: d, type: 'Page' });
      }
      const sourceIndex = nodeIndexMap.get('root')!;
      const targetIndex = nodeIndexMap.get(d)!;
      links.push({ source: sourceIndex, target: targetIndex, value: 5 });

      try {
        const response = await fetch(`https://${d}`, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' },
            redirect: 'follow',
        });
        const html = await response.text();
        const extracted = extractLinks(html, d);
        
        extracted.slice(0, 10).forEach(link => { // Limit links per page for visualization
            const url = new URL(link);
            const linkName = url.hostname + url.pathname.substring(0, 50);

            if (!nodeIndexMap.has(linkName)) {
                nodeIndexMap.set(linkName, nodes.length);
                nodes.push({ name: linkName, type: classifyLink(link, domain) });
            }
            const linkTargetIndex = nodeIndexMap.get(linkName)!;
            links.push({ source: targetIndex, target: linkTargetIndex, value: 1 });
        });
      } catch (e) {
          console.warn(`Could not fetch or parse https://${d}:`, e);
      }
    }

    if (nodes.length === 1 && links.length === 0) {
        throw new Error('Could not find any subdomains or links for the target.');
    }

    return { nodes, links };
  } catch (error) {
    if (error instanceof Error) {
        throw new Error(`Failed to crawl site: ${error.message}`);
    }
    throw new Error('An unknown error occurred during the crawl.');
  }
}
