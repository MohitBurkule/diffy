import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Upload, Download, FileText, Image, FileX, HardDrive } from 'lucide-react';
import { DiffResult } from '../DiffChecker';
import { useToast } from '@/hooks/use-toast';

interface FileDiffTabProps {
  onDiffComplete: (result: DiffResult) => void;
  onError: (error: string) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
}

interface FileInfo {
  name: string;
  size: number;
  type: string;
  content: string | ArrayBuffer | null;
  lastModified: number;
}

export const FileDiffTab: React.FC<FileDiffTabProps> = ({
  onDiffComplete,
  onError,
  isProcessing,
  setIsProcessing
}) => {
  const [leftFile, setLeftFile] = useState<FileInfo | null>(null);
  const [rightFile, setRightFile] = useState<FileInfo | null>(null);
  const [comparisonMode, setComparisonMode] = useState<'binary' | 'text' | 'metadata'>('binary');
  const { toast } = useToast();

  const handleFileUpload = useCallback((side: 'left' | 'right') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        if (file.size > 100 * 1024 * 1024) { // 100MB limit
          onError('File too large. Maximum size is 100MB.');
          return;
        }

        const reader = new FileReader();
        
        if (comparisonMode === 'text' || file.type.startsWith('text/')) {
          reader.onload = (e) => {
            const fileInfo: FileInfo = {
              name: file.name,
              size: file.size,
              type: file.type,
              content: e.target?.result as string,
              lastModified: file.lastModified
            };
            
            if (side === 'left') {
              setLeftFile(fileInfo);
            } else {
              setRightFile(fileInfo);
            }
          };
          reader.readAsText(file);
        } else {
          reader.onload = (e) => {
            const fileInfo: FileInfo = {
              name: file.name,
              size: file.size,
              type: file.type,
              content: e.target?.result as ArrayBuffer,
              lastModified: file.lastModified
            };
            
            if (side === 'left') {
              setLeftFile(fileInfo);
            } else {
              setRightFile(fileInfo);
            }
          };
          reader.readAsArrayBuffer(file);
        }
      }
    };
    input.click();
  }, [comparisonMode, onError]);

  const compareFiles = useCallback(async () => {
    if (!leftFile || !rightFile) {
      onError('Please upload both files to compare');
      return;
    }

    setIsProcessing(true);

    try {
      let result: DiffResult;

      switch (comparisonMode) {
        case 'metadata':
          result = {
            added: leftFile.name !== rightFile.name ? 1 : 0,
            removed: leftFile.size !== rightFile.size ? 1 : 0,
            modified: leftFile.lastModified !== rightFile.lastModified ? 1 : 0,
            unchanged: 0,
            total: 3
          };
          break;

        case 'text':
          if (typeof leftFile.content === 'string' && typeof rightFile.content === 'string') {
            const leftLines = leftFile.content.split('\n');
            const rightLines = rightFile.content.split('\n');
            
            let added = 0, removed = 0, modified = 0, unchanged = 0;
            
            const maxLines = Math.max(leftLines.length, rightLines.length);
            
            for (let i = 0; i < maxLines; i++) {
              const leftLine = leftLines[i] || '';
              const rightLine = rightLines[i] || '';
              
              if (leftLine === rightLine) {
                unchanged++;
              } else if (!leftLine) {
                added++;
              } else if (!rightLine) {
                removed++;
              } else {
                modified++;
              }
            }

            result = { added, removed, modified, unchanged, total: maxLines };
          } else {
            throw new Error('Cannot perform text comparison on binary files');
          }
          break;

        default: // binary
          if (leftFile.content instanceof ArrayBuffer && rightFile.content instanceof ArrayBuffer) {
            const leftBytes = new Uint8Array(leftFile.content);
            const rightBytes = new Uint8Array(rightFile.content);
            
            const maxLength = Math.max(leftBytes.length, rightBytes.length);
            let differentBytes = 0;
            
            for (let i = 0; i < maxLength; i++) {
              const leftByte = leftBytes[i] || 0;
              const rightByte = rightBytes[i] || 0;
              
              if (leftByte !== rightByte) {
                differentBytes++;
              }
            }

            result = {
              added: Math.max(0, rightBytes.length - leftBytes.length),
              removed: Math.max(0, leftBytes.length - rightBytes.length),
              modified: differentBytes,
              unchanged: maxLength - differentBytes,
              total: maxLength
            };
          } else {
            throw new Error('Cannot perform binary comparison on text files');
          }
      }

      onDiffComplete(result);

      toast({
        title: "File Comparison Complete",
        description: `Found ${result.added + result.removed + result.modified} differences`,
      });

    } catch (error) {
      onError('Failed to compare files: ' + (error as Error).message);
    } finally {
      setIsProcessing(false);
    }
  }, [leftFile, rightFile, comparisonMode, onDiffComplete, onError, setIsProcessing, toast]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('text/')) return FileText;
    if (type.startsWith('image/')) return Image;
    return FileX;
  };

  const renderFileInfo = (file: FileInfo | null, side: 'left' | 'right') => {
    if (!file) {
      return (
        <div className="aspect-[4/3] bg-muted rounded-lg flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <HardDrive className="h-12 w-12 mx-auto mb-2" />
            <p>No file uploaded</p>
          </div>
        </div>
      );
    }

    const FileIcon = getFileIcon(file.type);

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
          <FileIcon className="h-8 w-8 text-primary" />
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{file.name}</p>
            <p className="text-sm text-muted-foreground">{formatFileSize(file.size)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <Label className="text-xs text-muted-foreground">Type</Label>
            <p className="font-mono">{file.type || 'Unknown'}</p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Modified</Label>
            <p className="font-mono text-xs">
              {new Date(file.lastModified).toLocaleDateString()}
            </p>
          </div>
        </div>

        {comparisonMode === 'text' && typeof file.content === 'string' && (
          <div>
            <Label className="text-xs text-muted-foreground">Preview</Label>
            <div className="bg-background border rounded p-2 text-xs font-mono max-h-32 overflow-y-auto">
              {file.content.substring(0, 500)}
              {file.content.length > 500 && '...'}
            </div>
          </div>
        )}

        {comparisonMode === 'binary' && file.content instanceof ArrayBuffer && (
          <div>
            <Label className="text-xs text-muted-foreground">Binary Data</Label>
            <div className="bg-background border rounded p-2 text-xs font-mono">
              {Array.from(new Uint8Array(file.content.slice(0, 32)))
                .map(b => b.toString(16).padStart(2, '0'))
                .join(' ')}
              {file.content.byteLength > 32 && '...'}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap gap-4 p-4 bg-muted rounded-lg">
        <div className="flex items-center space-x-2">
          <Label htmlFor="comparison-mode">Comparison Mode:</Label>
          <select 
            id="comparison-mode"
            value={comparisonMode} 
            onChange={(e) => setComparisonMode(e.target.value as any)}
            className="px-3 py-1 rounded border bg-background"
          >
            <option value="binary">Binary</option>
            <option value="text">Text</option>
            <option value="metadata">Metadata Only</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline">
            Max file size: 100MB
          </Badge>
        </div>
      </div>

      {/* Upload Areas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <Label className="text-sm font-medium">Original File</Label>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleFileUpload('left')}
            >
              <Upload className="h-4 w-4 mr-1" />
              Upload
            </Button>
          </div>
          {renderFileInfo(leftFile, 'left')}
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <Label className="text-sm font-medium">Modified File</Label>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleFileUpload('right')}
            >
              <Upload className="h-4 w-4 mr-1" />
              Upload
            </Button>
          </div>
          {renderFileInfo(rightFile, 'right')}
        </Card>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Button 
          onClick={compareFiles}
          disabled={isProcessing || !leftFile || !rightFile}
          className="bg-primary hover:bg-primary/90"
        >
          {isProcessing ? 'Comparing...' : 'Compare Files'}
        </Button>

        <Button variant="outline" disabled={!leftFile && !rightFile}>
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>

        <Button 
          variant="outline" 
          onClick={() => {
            setLeftFile(null);
            setRightFile(null);
          }}
        >
          Clear All
        </Button>
      </div>

      {/* File Comparison Results */}
      {leftFile && rightFile && (
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Comparison Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <Label className="text-muted-foreground">File Names</Label>
              <p className={leftFile.name === rightFile.name ? 'text-green-600' : 'text-red-600'}>
                {leftFile.name === rightFile.name ? 'Same' : 'Different'}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">File Sizes</Label>
              <p className={leftFile.size === rightFile.size ? 'text-green-600' : 'text-red-600'}>
                {leftFile.size === rightFile.size ? 'Same' : 'Different'}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Types</Label>
              <p className={leftFile.type === rightFile.type ? 'text-green-600' : 'text-red-600'}>
                {leftFile.type === rightFile.type ? 'Same' : 'Different'}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};