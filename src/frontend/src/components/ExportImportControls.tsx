import { Download, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ExportImportControlsProps {
  onExport: () => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isExporting: boolean;
  isImporting: boolean;
}

export default function ExportImportControls({
  onExport,
  onImport,
  isExporting,
  isImporting,
}: ExportImportControlsProps) {
  return (
    <div className="fixed bottom-6 right-6 z-40 flex gap-2">
      <Button
        onClick={onExport}
        variant="outline"
        size="sm"
        disabled={isExporting}
        className="border-accent-cyan/50 hover:bg-accent-cyan/10 bg-card/90 backdrop-blur-sm shadow-lg"
      >
        {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
        Export
      </Button>
      <label>
        <Button
          variant="outline"
          size="sm"
          disabled={isImporting}
          className="border-accent-cyan/50 hover:bg-accent-cyan/10 bg-card/90 backdrop-blur-sm shadow-lg cursor-pointer"
          asChild
        >
          <span>
            {isImporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
            Import
          </span>
        </Button>
        <input type="file" accept=".json" onChange={onImport} className="hidden" />
      </label>
    </div>
  );
}
