import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Copy, Download, Upload, Zap } from 'lucide-react';
import { diffLines, diffWords, diffChars } from 'diff';
import { DiffResult } from '../DiffChecker';
import { useToast } from '@/hooks/use-toast';

interface TextDiffTabProps {
  onDiffComplete: (result: DiffResult) => void;
  onError: (error: string) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
}

type DiffGranularity = 'lines' | 'words' | 'chars';
type ViewMode = 'side-by-side' | 'unified';

export const TextDiffTab: React.FC<TextDiffTabProps> = ({
  onDiffComplete,
  onError,
  isProcessing,
  setIsProcessing
}) => {
  const [leftText, setLeftText] = useState('');
  const [rightText, setRightText] = useState('');
  const [diffGranularity, setDiffGranularity] = useState<DiffGranularity>('lines');
  const [viewMode, setViewMode] = useState<ViewMode>('side-by-side');
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);
  const [ignoreCase, setIgnoreCase] = useState(false);
  const { toast } = useToast();

  const performDiff = useCallback(() => {
    if (!leftText.trim() && !rightText.trim()) {
      onError('Please enter text to compare');
      return;
    }

    setIsProcessing(true);

    try {
      let processedLeft = leftText;
      let processedRight = rightText;

      if (ignoreCase) {
        processedLeft = processedLeft.toLowerCase();
        processedRight = processedRight.toLowerCase();
      }

      if (ignoreWhitespace) {
        processedLeft = processedLeft.replace(/\s+/g, ' ').trim();
        processedRight = processedRight.replace(/\s+/g, ' ').trim();
      }

      let diff;
      switch (diffGranularity) {
        case 'words':
          diff = diffWords(processedLeft, processedRight);
          break;
        case 'chars':
          diff = diffChars(processedLeft, processedRight);
          break;
        default:
          diff = diffLines(processedLeft, processedRight);
      }

      const result: DiffResult = {
        added: diff.filter(part => part.added).length,
        removed: diff.filter(part => part.removed).length,
        modified: 0,
        unchanged: diff.filter(part => !part.added && !part.removed).length,
        total: diff.length
      };

      onDiffComplete(result);
    } catch (error) {
      onError('Failed to perform diff: ' + (error as Error).message);
    } finally {
      setIsProcessing(false);
    }
  }, [leftText, rightText, diffGranularity, ignoreWhitespace, ignoreCase, onDiffComplete, onError, setIsProcessing]);

  const diffResult = useMemo(() => {
    if (!leftText && !rightText) return null;

    let processedLeft = leftText;
    let processedRight = rightText;

    if (ignoreCase) {
      processedLeft = processedLeft.toLowerCase();
      processedRight = processedRight.toLowerCase();
    }

    if (ignoreWhitespace) {
      processedLeft = processedLeft.replace(/\s+/g, ' ').trim();
      processedRight = processedRight.replace(/\s+/g, ' ').trim();
    }

    switch (diffGranularity) {
      case 'words':
        return diffWords(processedLeft, processedRight);
      case 'chars':
        return diffChars(processedLeft, processedRight);
      default:
        return diffLines(processedLeft, processedRight);
    }
  }, [leftText, rightText, diffGranularity, ignoreWhitespace, ignoreCase]);

  const handleFileUpload = useCallback((side: 'left' | 'right') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,.js,.ts,.jsx,.tsx,.py,.java,.cpp,.c,.h,.css,.html,.xml,.json,.md,.yml,.yaml';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          if (side === 'left') {
            setLeftText(content);
          } else {
            setRightText(content);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }, []);

  const copyToClipboard = useCallback((content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      toast({
        title: "Copied to clipboard",
        description: "Text has been copied successfully",
      });
    });
  }, [toast]);

  const renderDiffView = () => {
    if (!diffResult) return null;

    if (viewMode === 'unified') {
      return (
        <Card className="p-4">
          <div className="space-y-1 font-mono text-sm">
            {diffResult.map((part, index) => (
              <div
                key={index}
                className={`px-2 py-1 rounded ${
                  part.added 
                    ? 'bg-diff-added text-diff-added-text border-l-4 border-diff-added-border' 
                    : part.removed 
                    ? 'bg-diff-removed text-diff-removed-text border-l-4 border-diff-removed-border'
                    : 'bg-background'
                }`}
              >
                <span className="select-all">
                  {part.added && '+ '}
                  {part.removed && '- '}
                  {part.value}
                </span>
              </div>
            ))}
          </div>
        </Card>
      );
    }

    // Side-by-side view
    const leftParts = diffResult.filter(part => !part.added);
    const rightParts = diffResult.filter(part => !part.removed);

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="mb-2 text-sm font-medium text-muted-foreground">Original</div>
          <div className="space-y-1 font-mono text-sm max-h-96 overflow-y-auto">
            {leftParts.map((part, index) => (
              <div
                key={index}
                className={`px-2 py-1 rounded select-all ${
                  part.removed 
                    ? 'bg-diff-removed text-diff-removed-text border-l-4 border-diff-removed-border'
                    : 'bg-background'
                }`}
              >
                {part.value}
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <div className="mb-2 text-sm font-medium text-muted-foreground">Modified</div>
          <div className="space-y-1 font-mono text-sm max-h-96 overflow-y-auto">
            {rightParts.map((part, index) => (
              <div
                key={index}
                className={`px-2 py-1 rounded select-all ${
                  part.added 
                    ? 'bg-diff-added text-diff-added-text border-l-4 border-diff-added-border'
                    : 'bg-background'
                }`}
              >
                {part.value}
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap gap-4 p-4 bg-muted rounded-lg">
        <div className="flex items-center space-x-2">
          <Label htmlFor="granularity">Granularity:</Label>
          <select 
            id="granularity"
            value={diffGranularity} 
            onChange={(e) => setDiffGranularity(e.target.value as DiffGranularity)}
            className="px-3 py-1 rounded border bg-background"
          >
            <option value="lines">Lines</option>
            <option value="words">Words</option>
            <option value="chars">Characters</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <Label htmlFor="view-mode">View:</Label>
          <select 
            id="view-mode"
            value={viewMode} 
            onChange={(e) => setViewMode(e.target.value as ViewMode)}
            className="px-3 py-1 rounded border bg-background"
          >
            <option value="side-by-side">Side by Side</option>
            <option value="unified">Unified</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <Switch 
            id="ignore-whitespace"
            checked={ignoreWhitespace} 
            onCheckedChange={setIgnoreWhitespace} 
          />
          <Label htmlFor="ignore-whitespace">Ignore Whitespace</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch 
            id="ignore-case"
            checked={ignoreCase} 
            onCheckedChange={setIgnoreCase} 
          />
          <Label htmlFor="ignore-case">Ignore Case</Label>
        </div>
      </div>

      {/* Input Areas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <Label htmlFor="left-text" className="text-sm font-medium">Original Text</Label>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleFileUpload('left')}
              >
                <Upload className="h-4 w-4 mr-1" />
                Upload
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => copyToClipboard(leftText)}
                disabled={!leftText}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Textarea
            id="left-text"
            placeholder="Paste or type your original text here..."
            value={leftText}
            onChange={(e) => setLeftText(e.target.value)}
            className="min-h-[300px] font-mono text-sm"
          />
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <Label htmlFor="right-text" className="text-sm font-medium">Modified Text</Label>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleFileUpload('right')}
              >
                <Upload className="h-4 w-4 mr-1" />
                Upload
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => copyToClipboard(rightText)}
                disabled={!rightText}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Textarea
            id="right-text"
            placeholder="Paste or type your modified text here..."
            value={rightText}
            onChange={(e) => setRightText(e.target.value)}
            className="min-h-[300px] font-mono text-sm"
          />
        </Card>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Button 
          onClick={performDiff}
          disabled={isProcessing || (!leftText.trim() && !rightText.trim())}
          className="bg-primary hover:bg-primary/90"
        >
          <Zap className="h-4 w-4 mr-2" />
          {isProcessing ? 'Processing...' : 'Compare'}
        </Button>

        <Button variant="outline" disabled={!diffResult}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>

        <Button 
          variant="outline" 
          onClick={() => {
            setLeftText('');
            setRightText('');
          }}
        >
          Clear All
        </Button>
      </div>

      {/* Diff Results */}
      {diffResult && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {diffResult.filter(p => p.added).length} additions
            </Badge>
            <Badge variant="outline">
              {diffResult.filter(p => p.removed).length} deletions
            </Badge>
            <Badge variant="outline">
              {diffResult.filter(p => !p.added && !p.removed).length} unchanged
            </Badge>
          </div>
          
          {renderDiffView()}
        </div>
      )}
    </div>
  );
};