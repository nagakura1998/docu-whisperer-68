import { HeroSection } from "@/components/HeroSection";
import { FeatureSection } from "@/components/FeatureSection";
import { DocumentUpload } from "@/components/DocumentUpload";
import { ChatInterface } from "@/components/ChatInterface";

const Index = () => {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <FeatureSection />
      <DocumentUpload />
      <ChatInterface />
    </div>
  );
};

export default Index;
