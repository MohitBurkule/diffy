import React, { useState, useCallback, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Image, Folder, FileSpreadsheet, FileX, Settings, Share2, Link } from 'lucide-react';
import { TextDiffTab } from './tabs/TextDiffTab';
import { ImageDiffTab } from './tabs/ImageDiffTab';
import { FileDiffTab } from './tabs/FileDiffTab';
import { StatsPanel } from './StatsPanel';
import { SettingsDialog } from './SettingsDialog';
import { ThemeToggle } from './ThemeToggle';
import { useToast } from '@/hooks/use-toast';
import { shareComparison, parseSharedURL, cleanupOldShares } from '@/utils/urlSharing';

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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [leftContent, setLeftContent] = useState('');
  const [rightContent, setRightContent] = useState('');
  const [diffSettings, setDiffSettings] = useState<any>({});
  const { toast } = useToast();

  // Load shared content on mount
  useEffect(() => {
    const sharedData = parseSharedURL();
    if (sharedData) {
      setActiveTab(sharedData.mode);
      setLeftContent(sharedData.leftContent);
      setRightContent(sharedData.rightContent);
      setDiffSettings(sharedData.settings);
      toast({
        title: "Shared comparison loaded",
        description: `Loaded ${sharedData.mode} comparison from shared URL`,
      });
    }
    
    // Clean up old shares
    cleanupOldShares();
  }, [toast]);

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

  const handleShare = useCallback(async () => {
    if (!leftContent && !rightContent) {
      toast({
        title: "Nothing to share",
        description: "Please add some content to compare before sharing",
        variant: "destructive",
      });
      return;
    }

    try {
      const shareUrl = await shareComparison(
        activeTab,
        leftContent,
        rightContent,
        diffSettings
      );
      
      toast({
        title: "Link copied to clipboard! 🎉",
        description: "Anyone with this link can view your comparison",
      });
    } catch (error) {
      toast({
        title: "Failed to create share link",
        description: "Please try again",
        variant: "destructive",
      });
    }
  }, [activeTab, leftContent, rightContent, diffSettings, toast]);

  const handleContentChange = useCallback((left: string, right: string, settings: any = {}) => {
    setLeftContent(left);
    setRightContent(right);
    setDiffSettings(settings);
  }, []);

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
      <div className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-glow rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">D</span>
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                  Diff Scot
                </h1>
              </div>
              <p className="text-muted-foreground">
                Advanced comparison tool for text, images, files, and more
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {diffResult && (
                <div className="flex gap-2">
                  <Badge variant="outline" className="bg-diff-added text-diff-added-text">
                    +{diffResult.added}
                  </Badge>
                  <Badge variant="outline" className="bg-diff-removed text-diff-removed-text">
                    -{diffResult.removed}
                  </Badge>
                  {diffResult.modified > 0 && (
                    <Badge variant="outline" className="bg-diff-modified text-diff-modified-text">
                      ~{diffResult.modified}
                    </Badge>
                  )}
                </div>
              )}
              
              <Button 
                variant="outline" 
                size="icon"
                onClick={handleShare}
                title="Share this comparison"
              >
                <Share2 className="h-4 w-4" />
              </Button>
              
              <ThemeToggle />
              
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setSettingsOpen(true)}
                title="Settings"
              >
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
            <Card className="p-6 shadow-medium">
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as DiffMode)}>
                <div className="mb-6">
                  <TabsList className="grid grid-cols-3 md:grid-cols-6 w-full">
                    {tabConfig.map((tab) => (
                      <TabsTrigger 
                        key={tab.id} 
                        value={tab.id} 
                        className="flex items-center gap-2 text-xs sm:text-sm transition-all"
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
                        <div className="mb-4 p-4 bg-gradient-to-r from-accent/50 to-accent/30 rounded-lg border border-accent/20">
                          <div className="flex items-center gap-3 text-accent-foreground">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                              <tab.icon className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold">{tab.label} Comparison</h3>
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
                      onContentChange={handleContentChange}
                      initialLeftContent={leftContent}
                      initialRightContent={rightContent}
                      initialSettings={diffSettings}
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
                    <div className="text-center py-12 text-muted-foreground">
                      <FileSpreadsheet className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">Excel Comparison</h3>
                      <p>Advanced spreadsheet comparison coming soon...</p>
                    </div>
                  </TabsContent>

                  <TabsContent value="pdf" className="mt-0">
                    <div className="text-center py-12 text-muted-foreground">
                      <FileX className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">PDF Comparison</h3>
                      <p>Document analysis and comparison coming soon...</p>
                    </div>
                  </TabsContent>

                  <TabsContent value="folder" className="mt-0">
                    <div className="text-center py-12 text-muted-foreground">
                      <Folder className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">Folder Comparison</h3>
                      <p>Directory structure analysis coming soon...</p>
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

      {/* Settings Dialog */}
      <SettingsDialog 
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />
    </div>
  );
};