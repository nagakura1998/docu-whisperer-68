import { Button } from "@/components/ui/button";
import { FileText, Settings, User, Menu } from "lucide-react";

export const AppHeader = () => {
  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 shadow-soft">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-xl font-bold gradient-text">DocuChat AI</h1>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <Button variant="ghost" size="sm">
          <Settings className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm">
          <User className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
};