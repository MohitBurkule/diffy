import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Plus, 
  Minus, 
  Edit, 
  Check, 
  Clock, 
  Zap,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { DiffResult, DiffMode } from './DiffChecker';

interface StatsPanelProps {
  diffResult: DiffResult | null;
  isProcessing: boolean;
  activeMode: DiffMode;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({
  diffResult,
  isProcessing,
  activeMode
}) => {
  const getChangePercentage = () => {
    if (!diffResult || diffResult.total === 0) return 0;
    return ((diffResult.added + diffResult.removed + diffResult.modified) / diffResult.total) * 100;
  };

  const getModeLabel = (mode: DiffMode) => {
    const labels = {
      text: 'Text Lines',
      image: 'Pixels',
      file: 'Bytes',
      excel: 'Cells',
      pdf: 'Elements',
      folder: 'Files'
    };
    return labels[mode] || 'Items';
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <div className="space-y-4">
      {/* Quick Stats */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">Comparison Stats</h3>
        </div>

        {isProcessing && (
          <div className="text-center py-8">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Processing...</p>
          </div>
        )}

        {!isProcessing && !diffResult && (
          <div className="text-center py-8">
            <Zap className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Start a comparison to see statistics
            </p>
          </div>
        )}

        {diffResult && (
          <div className="space-y-4">
            {/* Change Overview */}
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {getChangePercentage().toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">
                Total Changes
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <Progress value={getChangePercentage()} className="h-2" />
              <div className="text-xs text-center text-muted-foreground">
                {formatNumber(diffResult.added + diffResult.removed + diffResult.modified)} of {formatNumber(diffResult.total)} {getModeLabel(activeMode).toLowerCase()}
              </div>
            </div>

            {/* Detailed Stats */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4 text-diff-added-text" />
                  <span className="text-sm">Added</span>
                </div>
                <Badge variant="outline" className="bg-diff-added text-diff-added-text">
                  {formatNumber(diffResult.added)}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Minus className="h-4 w-4 text-diff-removed-text" />
                  <span className="text-sm">Removed</span>
                </div>
                <Badge variant="outline" className="bg-diff-removed text-diff-removed-text">
                  {formatNumber(diffResult.removed)}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Edit className="h-4 w-4 text-diff-modified-text" />
                  <span className="text-sm">Modified</span>
                </div>
                <Badge variant="outline" className="bg-diff-modified text-diff-modified-text">
                  {formatNumber(diffResult.modified)}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-success" />
                  <span className="text-sm">Unchanged</span>
                </div>
                <Badge variant="outline" className="text-success">
                  {formatNumber(diffResult.unchanged)}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Performance Metrics */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">Performance</h3>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>Last Analysis</span>
            </div>
            <span className="text-muted-foreground">
              {diffResult ? 'Just now' : 'None'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span>Mode</span>
            <Badge variant="outline">
              {activeMode.charAt(0).toUpperCase() + activeMode.slice(1)}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span>Status</span>
            <Badge 
              variant={isProcessing ? "default" : diffResult ? "default" : "outline"}
              className={
                isProcessing 
                  ? "bg-warning text-warning-foreground" 
                  : diffResult 
                  ? "bg-success text-success-foreground"
                  : ""
              }
            >
              {isProcessing ? 'Processing' : diffResult ? 'Complete' : 'Ready'}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3">Quick Actions</h3>
        <div className="space-y-2 text-sm">
          <button className="w-full text-left p-2 rounded hover:bg-muted transition-colors">
            📊 Export Statistics
          </button>
          <button className="w-full text-left p-2 rounded hover:bg-muted transition-colors">
            📄 Generate Report
          </button>
          <button className="w-full text-left p-2 rounded hover:bg-muted transition-colors">
            🔗 Share Results
          </button>
          <button className="w-full text-left p-2 rounded hover:bg-muted transition-colors">
            ⚙️ Settings
          </button>
        </div>
      </Card>

      {/* Tips */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3">💡 Tips</h3>
        <div className="text-xs text-muted-foreground space-y-2">
          <p>• Use keyboard shortcuts for faster navigation</p>
          <p>• Upload files by dragging them onto the interface</p>
          <p>• Switch between modes for different comparison types</p>
          <p>• Export results for documentation</p>
        </div>
      </Card>
    </div>
  );
};