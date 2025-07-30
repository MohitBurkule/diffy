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

// Compress data using simple base64 encoding
function compressData(data: string): string {
  try {
    return btoa(encodeURIComponent(data));
  } catch (e) {
    return data;
  }
}

// Decompress data
function decompressData(data: string): string {
  try {
    return decodeURIComponent(atob(data));
  } catch (e) {
    return data;
  }
}

// Generate shareable URL
export function generateShareableURL(data: SharedDiffData): string {
  const baseUrl = window.location.origin + window.location.pathname;
  
  // For smaller data (< 1000 chars), use URL hash
  const jsonData = JSON.stringify(data);
  if (jsonData.length < 1000) {
    const compressed = compressData(jsonData);
    return `${baseUrl}#share=${compressed}`;
  }
  
  // For larger data, store in localStorage and use a reference
  const shareId = 'diff_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  localStorage.setItem(shareId, jsonData);
  
  // Also store in sessionStorage for cross-tab sharing
  const sessionKey = 'share_' + shareId;
  sessionStorage.setItem(sessionKey, jsonData);
  
  return `${baseUrl}#ref=${shareId}`;
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
  
  if (hash.startsWith('ref=')) {
    try {
      const shareId = hash.substring(4);
      let jsonData = localStorage.getItem(shareId);
      
      // Fallback to sessionStorage
      if (!jsonData) {
        jsonData = sessionStorage.getItem('share_' + shareId);
      }
      
      if (jsonData) {
        return JSON.parse(jsonData) as SharedDiffData;
      }
    } catch (e) {
      console.error('Failed to retrieve shared data:', e);
    }
  }
  
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