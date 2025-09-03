import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, MessageCircle, Search, FileCheck, Brain, Users } from "lucide-react";

const features = [
  {
    icon: Upload,
    title: "Multi-Format Support",
    description: "Upload PDFs, Word docs, text files, images, and more. We handle the extraction automatically."
  },
  {
    icon: MessageCircle,
    title: "Natural Conversations",
    description: "Ask questions in plain English and get intelligent answers based on your document content."
  },
  {
    icon: Search,
    title: "Semantic Search", 
    description: "Find information across all your documents with AI-powered search that understands context."
  },
  {
    icon: FileCheck,
    title: "Source Citations",
    description: "Every answer includes exact citations showing where the information came from in your documents."
  },
  {
    icon: Brain,
    title: "Smart Insights",
    description: "Get summaries, key points, and cross-document analysis to unlock deeper understanding."
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Share document conversations with your team and build a collaborative knowledge base."
  }
];

export const FeatureSection = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Powerful Features for
            <span className="gradient-text ml-2">Document Intelligence</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Transform how you interact with documents using cutting-edge AI technology
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="shadow-soft hover:shadow-medium transition-smooth bg-card border-border hover:border-primary/20"
            >
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-3 rounded-lg bg-primary/10 w-fit">
                  <feature.icon className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl font-semibold">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};