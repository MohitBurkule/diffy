import React, { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Upload, Download, RotateCcw, Eye, EyeOff } from 'lucide-react';
import { DiffResult } from '../DiffChecker';
import { useToast } from '@/hooks/use-toast';

interface ImageDiffTabProps {
  onDiffComplete: (result: DiffResult) => void;
  onError: (error: string) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
}

export const ImageDiffTab: React.FC<ImageDiffTabProps> = ({
  onDiffComplete,
  onError,
  isProcessing,
  setIsProcessing
}) => {
  const [leftImage, setLeftImage] = useState<string | null>(null);
  const [rightImage, setRightImage] = useState<string | null>(null);
  const [opacity, setOpacity] = useState([50]);
  const [showOverlay, setShowOverlay] = useState(true);
  const [viewMode, setViewMode] = useState<'side-by-side' | 'overlay' | 'difference'>('side-by-side');
  const { toast } = useToast();

  const leftCanvasRef = useRef<HTMLCanvasElement>(null);
  const rightCanvasRef = useRef<HTMLCanvasElement>(null);
  const diffCanvasRef = useRef<HTMLCanvasElement>(null);

  const handleImageUpload = useCallback((side: 'left' | 'right') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
          onError('Image file too large. Maximum size is 10MB.');
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          if (side === 'left') {
            setLeftImage(dataUrl);
          } else {
            setRightImage(dataUrl);
          }
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  }, [onError]);

  const calculateDifference = useCallback(async () => {
    if (!leftImage || !rightImage) {
      onError('Please upload both images to compare');
      return;
    }

    setIsProcessing(true);

    try {
      // Create image elements
      const img1 = new Image();
      const img2 = new Image();

      await Promise.all([
        new Promise((resolve) => {
          img1.onload = resolve;
          img1.src = leftImage;
        }),
        new Promise((resolve) => {
          img2.onload = resolve;
          img2.src = rightImage;
        })
      ]);

      // Get canvas contexts
      const leftCanvas = leftCanvasRef.current;
      const rightCanvas = rightCanvasRef.current;
      const diffCanvas = diffCanvasRef.current;

      if (!leftCanvas || !rightCanvas || !diffCanvas) return;

      const leftCtx = leftCanvas.getContext('2d');
      const rightCtx = rightCanvas.getContext('2d');
      const diffCtx = diffCanvas.getContext('2d');

      if (!leftCtx || !rightCtx || !diffCtx) return;

      // Set canvas dimensions
      const maxWidth = 800;
      const maxHeight = 600;
      
      const scale1 = Math.min(maxWidth / img1.width, maxHeight / img1.height);
      const scale2 = Math.min(maxWidth / img2.width, maxHeight / img2.height);
      const scale = Math.min(scale1, scale2);

      const width = Math.max(img1.width * scale, img2.width * scale);
      const height = Math.max(img1.height * scale, img2.height * scale);

      [leftCanvas, rightCanvas, diffCanvas].forEach(canvas => {
        canvas.width = width;
        canvas.height = height;
      });

      // Draw images
      leftCtx.fillStyle = '#ffffff';
      leftCtx.fillRect(0, 0, width, height);
      leftCtx.drawImage(img1, 0, 0, img1.width * scale, img1.height * scale);

      rightCtx.fillStyle = '#ffffff';
      rightCtx.fillRect(0, 0, width, height);
      rightCtx.drawImage(img2, 0, 0, img2.width * scale, img2.height * scale);

      // Calculate pixel differences
      const leftImageData = leftCtx.getImageData(0, 0, width, height);
      const rightImageData = rightCtx.getImageData(0, 0, width, height);
      const diffImageData = diffCtx.createImageData(width, height);

      let differentPixels = 0;
      const totalPixels = width * height;

      for (let i = 0; i < leftImageData.data.length; i += 4) {
        const r1 = leftImageData.data[i];
        const g1 = leftImageData.data[i + 1];
        const b1 = leftImageData.data[i + 2];
        
        const r2 = rightImageData.data[i];
        const g2 = rightImageData.data[i + 1];
        const b2 = rightImageData.data[i + 2];

        const diff = Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);
        
        if (diff > 30) { // Threshold for significant difference
          differentPixels++;
          // Highlight differences in red
          diffImageData.data[i] = 255;     // R
          diffImageData.data[i + 1] = 0;   // G
          diffImageData.data[i + 2] = 0;   // B
          diffImageData.data[i + 3] = 255; // A
        } else {
          // Keep original pixel but make it semi-transparent
          diffImageData.data[i] = Math.max(r1, r2);
          diffImageData.data[i + 1] = Math.max(g1, g2);
          diffImageData.data[i + 2] = Math.max(b1, b2);
          diffImageData.data[i + 3] = 100;
        }
      }

      diffCtx.putImageData(diffImageData, 0, 0);

      const result: DiffResult = {
        added: 0,
        removed: 0,
        modified: differentPixels,
        unchanged: totalPixels - differentPixels,
        total: totalPixels
      };

      onDiffComplete(result);

      toast({
        title: "Image Analysis Complete",
        description: `${((differentPixels / totalPixels) * 100).toFixed(2)}% of pixels differ`,
      });

    } catch (error) {
      onError('Failed to analyze images: ' + (error as Error).message);
    } finally {
      setIsProcessing(false);
    }
  }, [leftImage, rightImage, onDiffComplete, onError, setIsProcessing, toast]);

  const renderImageView = () => {
    switch (viewMode) {
      case 'overlay':
        return (
          <Card className="p-4">
            <div className="mb-4">
              <Label>Opacity: {opacity[0]}%</Label>
              <Slider
                value={opacity}
                onValueChange={setOpacity}
                max={100}
                step={1}
                className="mt-2"
              />
            </div>
            <div className="relative bg-white rounded border">
              {leftImage && (
                <img 
                  src={leftImage} 
                  alt="Original" 
                  className="w-full max-w-2xl rounded"
                />
              )}
              {rightImage && (
                <img 
                  src={rightImage} 
                  alt="Modified" 
                  className="absolute top-0 left-0 w-full max-w-2xl rounded"
                  style={{ opacity: opacity[0] / 100 }}
                />
              )}
            </div>
          </Card>
        );

      case 'difference':
        return (
          <Card className="p-4">
            <div className="mb-2 text-sm font-medium text-muted-foreground">
              Difference Map (Red = Different pixels)
            </div>
            <div className="bg-white rounded border p-4">
              <canvas 
                ref={diffCanvasRef}
                className="max-w-full h-auto border rounded"
              />
            </div>
          </Card>
        );

      default: // side-by-side
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4">
              <div className="mb-2 text-sm font-medium text-muted-foreground">Original</div>
              <div className="bg-white rounded border p-4">
                {leftImage ? (
                  <>
                    <canvas 
                      ref={leftCanvasRef}
                      className="max-w-full h-auto border rounded"
                    />
                    <img 
                      src={leftImage} 
                      alt="Original" 
                      className="hidden"
                    />
                  </>
                ) : (
                  <div className="aspect-video bg-muted rounded flex items-center justify-center">
                    <span className="text-muted-foreground">No image uploaded</span>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-4">
              <div className="mb-2 text-sm font-medium text-muted-foreground">Modified</div>
              <div className="bg-white rounded border p-4">
                {rightImage ? (
                  <>
                    <canvas 
                      ref={rightCanvasRef}
                      className="max-w-full h-auto border rounded"
                    />
                    <img 
                      src={rightImage} 
                      alt="Modified" 
                      className="hidden"
                    />
                  </>
                ) : (
                  <div className="aspect-video bg-muted rounded flex items-center justify-center">
                    <span className="text-muted-foreground">No image uploaded</span>
                  </div>
                )}
              </div>
            </Card>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap gap-4 p-4 bg-muted rounded-lg">
        <div className="flex items-center space-x-2">
          <Label htmlFor="view-mode">View Mode:</Label>
          <select 
            id="view-mode"
            value={viewMode} 
            onChange={(e) => setViewMode(e.target.value as any)}
            className="px-3 py-1 rounded border bg-background"
          >
            <option value="side-by-side">Side by Side</option>
            <option value="overlay">Overlay</option>
            <option value="difference">Difference Map</option>
          </select>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowOverlay(!showOverlay)}
        >
          {showOverlay ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
          {showOverlay ? 'Hide' : 'Show'} Overlay
        </Button>
      </div>

      {/* Upload Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="text-center">
            <Label className="text-sm font-medium mb-3 block">Original Image</Label>
            <Button 
              variant="outline" 
              onClick={() => handleImageUpload('left')}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Original
            </Button>
            {leftImage && (
              <div className="mt-2 text-xs text-muted-foreground">
                Image loaded successfully
              </div>
            )}
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-center">
            <Label className="text-sm font-medium mb-3 block">Modified Image</Label>
            <Button 
              variant="outline" 
              onClick={() => handleImageUpload('right')}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Modified
            </Button>
            {rightImage && (
              <div className="mt-2 text-xs text-muted-foreground">
                Image loaded successfully
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Button 
          onClick={calculateDifference}
          disabled={isProcessing || !leftImage || !rightImage}
          className="bg-primary hover:bg-primary/90"
        >
          {isProcessing ? 'Analyzing...' : 'Analyze Images'}
        </Button>

        <Button variant="outline" disabled={!leftImage && !rightImage}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>

        <Button 
          variant="outline" 
          onClick={() => {
            setLeftImage(null);
            setRightImage(null);
          }}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Clear All
        </Button>
      </div>

      {/* Image View */}
      {renderImageView()}
    </div>
  );
};
