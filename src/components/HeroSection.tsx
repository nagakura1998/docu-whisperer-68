import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileText, MessageSquare, Zap } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";

export const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center gradient-primary overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(255,255,255,0.2),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(255,255,255,0.1),transparent_50%)]" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Hero Content */}
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 leading-tight">
              Chat with Your
              <span className="block gradient-text bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                Documents
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed">
              Upload any document and get instant, intelligent answers. Transform static files into interactive conversations with AI-powered insights.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button 
                size="lg" 
                className="bg-white text-primary hover:bg-white/90 shadow-large px-8 py-4 text-lg font-semibold transition-smooth"
              >
                Start Chatting
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="border-white/30 text-white hover:bg-white/10 px-8 py-4 text-lg font-semibold transition-smooth"
              >
                See Demo
              </Button>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 shadow-large">
              <img 
                src={heroImage} 
                alt="AI Document Q&A Interface" 
                className="w-full h-auto rounded-lg"
              />
            </Card>
            
            {/* floating elements */}
            <div className="absolute -top-4 -left-4 bg-white/20 backdrop-blur-sm rounded-lg p-3 shadow-medium animate-bounce">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div className="absolute -top-4 -right-4 bg-white/20 backdrop-blur-sm rounded-lg p-3 shadow-medium animate-bounce" style={{ animationDelay: '0.5s' }}>
              <MessageSquare className="h-6 w-6 text-white" />
            </div>
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-white/20 backdrop-blur-sm rounded-lg p-3 shadow-medium animate-bounce" style={{ animationDelay: '1s' }}>
              <Zap className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};