import { AppHeader } from "@/components/AppHeader";
import { DocumentPanel } from "@/components/DocumentPanel";
import { ChatPanel } from "@/components/ChatPanel";

const Index = () => {
  return (
    <div className="h-screen flex flex-col bg-background">
      <AppHeader />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Document Panel */}
        <div className="w-80 border-r border-border bg-muted/30">
          <div className="h-full p-4">
            <DocumentPanel />
          </div>
        </div>
        
        {/* Chat Panel */}
        <div className="flex-1 bg-background">
          <div className="h-full p-4">
            <ChatPanel />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
