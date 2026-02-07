import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw,
  Zap,
  Settings2,
  Grid3X3,
  Target,
  Timer,
  Hash
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from 'react';

export const SimulationControls = ({ 
  isInitialized, 
  isRunning, 
  isPaused,
  config,
  setConfig,
  onInitialize,
  onCommand 
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleConfigChange = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-3" data-testid="simulation-controls">
      <div className="grid grid-cols-2 gap-2">
        {!isInitialized ? (
          <Button
            onClick={onInitialize}
            className="col-span-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white h-9"
            data-testid="init-button"
          >
            <Zap className="w-4 h-4 mr-2" />
            Initialize
          </Button>
        ) : (
          <>
            {!isRunning ? (
              <Button
                onClick={() => onCommand('start')}
                className="bg-[#10B981] hover:bg-[#059669] text-white h-9"
                data-testid="start-button"
              >
                <Play className="w-4 h-4 mr-1" />
                Start
              </Button>
            ) : isPaused ? (
              <Button
                onClick={() => onCommand('resume')}
                className="bg-[#10B981] hover:bg-[#059669] text-white h-9"
                data-testid="resume-button"
              >
                <Play className="w-4 h-4 mr-1" />
                Resume
              </Button>
            ) : (
              <Button
                onClick={() => onCommand('pause')}
                className="bg-[#F59E0B] hover:bg-[#D97706] text-white h-9"
                data-testid="pause-button"
              >
                <Pause className="w-4 h-4 mr-1" />
                Pause
              </Button>
            )}
            
            <Button
              onClick={() => onCommand('stop')}
              variant="destructive"
              disabled={!isRunning}
              className="h-9"
              data-testid="stop-button"
            >
              <Square className="w-4 h-4 mr-1" />
              Stop
            </Button>
            
            <Button
              onClick={() => onCommand('reset')}
              variant="outline"
              className="col-span-2 border-[#27272A] text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#27272A] h-8"
              data-testid="reset-button"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Reset
            </Button>
          </>
        )}
      </div>

      {!isRunning && (
        <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              className="w-full justify-between text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#27272A] h-8 text-xs"
              data-testid="toggle-config"
            >
              <span className="flex items-center gap-2">
                <Settings2 className="w-3 h-3" />
                Configuration
              </span>
              <span className="text-[10px]">{showAdvanced ? '−' : '+'}</span>
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="space-y-2 mt-2 pt-2 border-t border-[#27272A]">
            <div>
              <Label className="text-[10px] text-[#71717A] mb-1 flex items-center gap-1">
                <Grid3X3 className="w-3 h-3" />
                Grid: {config.grid_width}x{config.grid_height}
              </Label>
              <Slider
                value={[config.grid_width]}
                onValueChange={([v]) => {
                  handleConfigChange('grid_width', v);
                  handleConfigChange('grid_height', v);
                }}
                min={10}
                max={30}
                step={5}
                className="py-1"
                data-testid="grid-slider"
              />
            </div>

            <div>
              <Label className="text-[10px] text-[#71717A] mb-1 flex items-center gap-1">
                <Zap className="w-3 h-3" />
                Agents: {config.num_agents}
              </Label>
              <Slider
                value={[config.num_agents]}
                onValueChange={([v]) => handleConfigChange('num_agents', v)}
                min={2}
                max={8}
                step={1}
                className="py-1"
                data-testid="agents-slider"
              />
            </div>

            <div>
              <Label className="text-[10px] text-[#71717A] mb-1 flex items-center gap-1">
                <Target className="w-3 h-3" />
                Targets: {config.num_targets}
              </Label>
              <Slider
                value={[config.num_targets]}
                onValueChange={([v]) => handleConfigChange('num_targets', v)}
                min={1}
                max={15}
                step={1}
                className="py-1"
                data-testid="targets-slider"
              />
            </div>

            <div>
              <Label className="text-[10px] text-[#71717A] mb-1 flex items-center gap-1">
                <Timer className="w-3 h-3" />
                Duration: {config.duration_seconds}s
              </Label>
              <Slider
                value={[config.duration_seconds]}
                onValueChange={([v]) => handleConfigChange('duration_seconds', v)}
                min={30}
                max={300}
                step={30}
                className="py-1"
                data-testid="duration-slider"
              />
            </div>

            <div>
              <Label className="text-[10px] text-[#71717A] mb-1 flex items-center gap-1">
                <Hash className="w-3 h-3" />
                Random Seed
              </Label>
              <Input
                type="number"
                value={config.seed}
                onChange={(e) => handleConfigChange('seed', parseInt(e.target.value) || 42)}
                className="bg-[#0D0D0F] border-[#27272A] text-[#FAFAFA] h-7 text-xs"
                data-testid="seed-input"
              />
            </div>

            {isInitialized && (
              <Button
                onClick={onInitialize}
                variant="outline"
                className="w-full border-[#27272A] text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#27272A] h-7 text-xs"
                data-testid="reinit-button"
              >
                Apply & Re-initialize
              </Button>
            )}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
};

export default SimulationControls;
