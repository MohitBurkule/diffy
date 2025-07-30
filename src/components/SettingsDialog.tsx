import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Palette, 
  Zap, 
  FileText, 
  Globe, 
  Bell, 
  Shield,
  Download,
  Upload,
  Keyboard
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({
  open,
  onOpenChange
}) => {
  const [autoSave, setAutoSave] = useState(true);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [comparisonSpeed, setComparisonSpeed] = useState([75]);
  const [notifications, setNotifications] = useState(true);
  const [maxFileSize, setMaxFileSize] = useState([100]);

  const handleExportSettings = () => {
    const settings = {
      autoSave,
      showLineNumbers,
      comparisonSpeed: comparisonSpeed[0],
      notifications,
      maxFileSize: maxFileSize[0],
      theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light'
    };
    
    const blob = new Blob([JSON.stringify(settings, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'diff-scot-settings.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportSettings = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const settings = JSON.parse(e.target?.result as string);
            setAutoSave(settings.autoSave ?? true);
            setShowLineNumbers(settings.showLineNumbers ?? true);
            setComparisonSpeed([settings.comparisonSpeed ?? 75]);
            setNotifications(settings.notifications ?? true);
            setMaxFileSize([settings.maxFileSize ?? 100]);
          } catch (error) {
            console.error('Invalid settings file:', error);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Settings
          </DialogTitle>
          <DialogDescription>
            Configure your Diff Scot preferences and behavior
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Theme Settings */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              <Label className="text-sm font-medium">Appearance</Label>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="theme-toggle">Theme</Label>
              <ThemeToggle />
            </div>
          </div>

          <Separator />

          {/* Comparison Settings */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              <Label className="text-sm font-medium">Comparison</Label>
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-save">Auto-save results</Label>
              <Switch
                id="auto-save"
                checked={autoSave}
                onCheckedChange={setAutoSave}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="line-numbers">Show line numbers</Label>
              <Switch
                id="line-numbers"
                checked={showLineNumbers}
                onCheckedChange={setShowLineNumbers}
              />
            </div>

            <div className="space-y-2">
              <Label>Comparison Speed: {comparisonSpeed[0]}%</Label>
              <Slider
                value={comparisonSpeed}
                onValueChange={setComparisonSpeed}
                max={100}
                min={25}
                step={25}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Thorough</span>
                <span>Fast</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* File Settings */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <Label className="text-sm font-medium">File Handling</Label>
            </div>

            <div className="space-y-2">
              <Label>Max File Size: {maxFileSize[0]}MB</Label>
              <Slider
                value={maxFileSize}
                onValueChange={setMaxFileSize}
                max={500}
                min={10}
                step={10}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>10MB</span>
                <span>500MB</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Notifications */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <Label className="text-sm font-medium">Notifications</Label>
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="notifications">Enable notifications</Label>
              <Switch
                id="notifications"
                checked={notifications}
                onCheckedChange={setNotifications}
              />
            </div>
          </div>

          <Separator />

          {/* Keyboard Shortcuts */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Keyboard className="h-4 w-4" />
              <Label className="text-sm font-medium">Keyboard Shortcuts</Label>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span>Compare</span>
                <Badge variant="outline" className="text-xs">Ctrl+Enter</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Clear All</span>
                <Badge variant="outline" className="text-xs">Ctrl+K</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Copy Result</span>
                <Badge variant="outline" className="text-xs">Ctrl+C</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Settings</span>
                <Badge variant="outline" className="text-xs">Ctrl+,</Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Import/Export */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <Label className="text-sm font-medium">Settings Management</Label>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleImportSettings}
                className="flex-1"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExportSettings}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={() => onOpenChange(false)}>
              Save Settings
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};