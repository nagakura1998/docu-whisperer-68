import { AppHeader } from "@/components/AppHeader";
import { DocumentPanel } from "@/components/DocumentPanel";
import { ChatPanel } from "@/components/ChatPanel";
import { ProjectSelector } from "@/components/ProjectSelector";
import { ProjectProvider } from "@/contexts/ProjectContext";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <AppHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <p className="text-lg mb-2">Please log in to access your projects</p>
            <p className="text-sm">You need to authenticate to manage documents and chat with AI</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ProjectProvider>
      <div className="h-screen flex flex-col bg-background">
        <AppHeader />
        
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Projects & Documents */}
          <div className="w-80 border-r border-border bg-muted/30">
            <div className="h-full p-4 flex flex-col">
              <ProjectSelector />
              <div className="flex-1 min-h-0">
                <DocumentPanel />
              </div>
            </div>
          </div>
          
          {/* Right Panel - Chat */}
          <div className="flex-1 bg-background">
            <div className="h-full p-4">
              <ChatPanel />
            </div>
          </div>
        </div>
      </div>
    </ProjectProvider>
  );
};

export default Index;
