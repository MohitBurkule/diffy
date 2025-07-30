import React, { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Image, Folder, FileSpreadsheet, FileX, Settings } from 'lucide-react';
import { TextDiffTab } from './tabs/TextDiffTab';
import { ImageDiffTab } from './tabs/ImageDiffTab';
import { FileDiffTab } from './tabs/FileDiffTab';
import { StatsPanel } from './StatsPanel';
import { useToast } from '@/hooks/use-toast';

export type DiffMode = 'text' | 'image' | 'file' | 'excel' | 'pdf' | 'folder';

export interface DiffResult {
  added: number;
  removed: number;
  modified: number;
  unchanged: number;
  total: number;
}

export const DiffChecker: React.FC = () => {
  const [activeTab, setActiveTab] = useState<DiffMode>('text');
  const [diffResult, setDiffResult] = useState<DiffResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleDiffComplete = useCallback((result: DiffResult) => {
    setDiffResult(result);
    toast({
      title: "Diff Analysis Complete",
      description: `Found ${result.added + result.removed + result.modified} changes`,
    });
  }, [toast]);

  const handleError = useCallback((error: string) => {
    toast({
      title: "Error",
      description: error,
      variant: "destructive",
    });
  }, [toast]);

  const tabConfig = [
    { id: 'text' as DiffMode, label: 'Text', icon: FileText, description: 'Compare text files and code' },
    { id: 'image' as DiffMode, label: 'Images', icon: Image, description: 'Visual image comparison' },
    { id: 'file' as DiffMode, label: 'Files', icon: Folder, description: 'Binary and document files' },
    { id: 'excel' as DiffMode, label: 'Excel', icon: FileSpreadsheet, description: 'Spreadsheet comparison' },
    { id: 'pdf' as DiffMode, label: 'PDF', icon: FileX, description: 'PDF document analysis' },
    { id: 'folder' as DiffMode, label: 'Folders', icon: Folder, description: 'Directory structure' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">DiffChecker Pro</h1>
              <p className="text-muted-foreground mt-1">
                Advanced comparison tool for text, images, files, and more
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {diffResult && (
                <div className="flex gap-2">
                  <Badge variant="default" className="bg-diff-added text-diff-added-text">
                    +{diffResult.added}
                  </Badge>
                  <Badge variant="default" className="bg-diff-removed text-diff-removed-text">
                    -{diffResult.removed}
                  </Badge>
                  <Badge variant="default" className="bg-diff-modified text-diff-modified-text">
                    ~{diffResult.modified}
                  </Badge>
                </div>
              )}
              <Button variant="outline" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Diff Panel */}
          <div className="lg:col-span-3">
            <Card className="p-6">
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as DiffMode)}>
                <div className="mb-6">
                  <TabsList className="grid grid-cols-3 md:grid-cols-6 w-full">
                    {tabConfig.map((tab) => (
                      <TabsTrigger 
                        key={tab.id} 
                        value={tab.id} 
                        className="flex items-center gap-2 text-xs sm:text-sm"
                      >
                        <tab.icon className="h-4 w-4" />
                        <span className="hidden sm:inline">{tab.label}</span>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>

                <div className="space-y-4">
                  {tabConfig.map((tab) => (
                    <div key={tab.id}>
                      {activeTab === tab.id && (
                        <div className="mb-4 p-3 bg-accent rounded-lg">
                          <div className="flex items-center gap-2 text-accent-foreground">
                            <tab.icon className="h-5 w-5" />
                            <div>
                              <h3 className="font-medium">{tab.label} Comparison</h3>
                              <p className="text-sm text-muted-foreground">{tab.description}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  <TabsContent value="text" className="mt-0">
                    <TextDiffTab 
                      onDiffComplete={handleDiffComplete}
                      onError={handleError}
                      isProcessing={isProcessing}
                      setIsProcessing={setIsProcessing}
                    />
                  </TabsContent>

                  <TabsContent value="image" className="mt-0">
                    <ImageDiffTab 
                      onDiffComplete={handleDiffComplete}
                      onError={handleError}
                      isProcessing={isProcessing}
                      setIsProcessing={setIsProcessing}
                    />
                  </TabsContent>

                  <TabsContent value="file" className="mt-0">
                    <FileDiffTab 
                      onDiffComplete={handleDiffComplete}
                      onError={handleError}
                      isProcessing={isProcessing}
                      setIsProcessing={setIsProcessing}
                    />
                  </TabsContent>

                  <TabsContent value="excel" className="mt-0">
                    <div className="text-center py-8 text-muted-foreground">
                      Excel comparison coming soon...
                    </div>
                  </TabsContent>

                  <TabsContent value="pdf" className="mt-0">
                    <div className="text-center py-8 text-muted-foreground">
                      PDF comparison coming soon...
                    </div>
                  </TabsContent>

                  <TabsContent value="folder" className="mt-0">
                    <div className="text-center py-8 text-muted-foreground">
                      Folder comparison coming soon...
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </Card>
          </div>

          {/* Stats Panel */}
          <div className="lg:col-span-1">
            <StatsPanel 
              diffResult={diffResult}
              isProcessing={isProcessing}
              activeMode={activeTab}
            />
          </div>
        </div>
      </div>
    </div>
  );
};