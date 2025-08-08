import { DiffMode } from '@/components/DiffChecker';

export interface SharedDiffData {
  mode: DiffMode;
  leftContent: string;
  rightContent: string;
  settings: {
    diffGranularity?: string;
    viewMode?: string;
    ignoreWhitespace?: boolean;
    ignoreCase?: boolean;
  };
  timestamp: number;
}

// Compress/decompress using LZ-String for higher density and URL safety
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';

function compressData(data: string): string {
  try {
    return compressToEncodedURIComponent(data);
  } catch (e) {
    return data;
  }
}

function decompressData(data: string): string {
  try {
    return decompressFromEncodedURIComponent(data) ?? data;
  } catch (e) {
    return data;
  }
}

// Generate shareable URL (always embeds compressed data in the hash)
export function generateShareableURL(data: SharedDiffData): string {
  const baseUrl = window.location.origin + window.location.pathname;
  const jsonData = JSON.stringify(data);
  const compressed = compressData(jsonData);
  return `${baseUrl}#share=${compressed}`;
}

// Parse shared URL and retrieve data
export function parseSharedURL(): SharedDiffData | null {
  const hash = window.location.hash.substring(1);
  
  if (hash.startsWith('share=')) {
    try {
      const compressed = hash.substring(6);
      const jsonData = decompressData(compressed);
      return JSON.parse(jsonData) as SharedDiffData;
    } catch (e) {
      console.error('Failed to parse shared URL:', e);
      return null;
    }
  }
  // Not a share link
  return null;
}

// Create a shareable link with all diff data
export async function shareComparison(
  mode: DiffMode,
  leftContent: string,
  rightContent: string,
  settings: any = {}
): Promise<string> {
  const data: SharedDiffData = {
    mode,
    leftContent,
    rightContent,
    settings,
    timestamp: Date.now()
  };
  
  const shareUrl = generateShareableURL(data);
  
  // Copy to clipboard
  try {
    await navigator.clipboard.writeText(shareUrl);
  } catch (e) {
    // Fallback for browsers that don't support clipboard API
    const textArea = document.createElement('textarea');
    textArea.value = shareUrl;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  }
  
  return shareUrl;
}

// Clean up old stored shares (call periodically)
export function cleanupOldShares(): void {
  const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
  const now = Date.now();
  
  // Clean localStorage
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('diff_')) {
      try {
        const data = JSON.parse(localStorage.getItem(key) || '{}');
        if (data.timestamp && now - data.timestamp > maxAge) {
          localStorage.removeItem(key);
        }
      } catch (e) {
        // Remove invalid entries
        localStorage.removeItem(key);
      }
    }
  });
  
  // Clean sessionStorage
  Object.keys(sessionStorage).forEach(key => {
    if (key.startsWith('share_diff_')) {
      try {
        const data = JSON.parse(sessionStorage.getItem(key) || '{}');
        if (data.timestamp && now - data.timestamp > maxAge) {
          sessionStorage.removeItem(key);
        }
      } catch (e) {
        sessionStorage.removeItem(key);
      }
    }
  });
}