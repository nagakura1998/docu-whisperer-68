import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, FileText } from "lucide-react";

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  citation?: {
    document: string;
    page?: number;
  };
}

export const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: "Hello! I'm ready to answer questions about your documents. Upload some files and start asking!",
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState("");

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    
    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: `I understand you're asking about "${inputValue}". Once you upload documents, I'll be able to provide detailed answers with specific citations from your files.`,
        timestamp: new Date(),
        citation: {
          document: "sample-document.pdf",
          page: 1
        }
      };
      setMessages(prev => [...prev, aiMessage]);
    }, 1000);

    setInputValue("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <section className="py-16 bg-chat-bg">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Interactive Chat Interface
            </h2>
            <p className="text-lg text-muted-foreground">
              Ask questions about your documents and get instant, intelligent answers
            </p>
          </div>

          <Card className="shadow-large bg-card border-border">
            <CardHeader className="border-b border-border">
              <CardTitle className="flex items-center space-x-2">
                <Bot className="h-5 w-5 text-primary" />
                <span>Document Q&A Assistant</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {/* Messages */}
              <ScrollArea className="h-[500px] p-6">
                <div className="space-y-6">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-start space-x-3 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          message.type === 'user' ? 'bg-primary' : 'bg-secondary'
                        }`}>
                          {message.type === 'user' ? (
                            <User className="h-4 w-4 text-primary-foreground" />
                          ) : (
                            <Bot className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <div className={`rounded-2xl px-4 py-3 ${
                          message.type === 'user' 
                            ? 'chat-message-user' 
                            : 'chat-message-ai border border-border'
                        }`}>
                          <p className="text-sm leading-relaxed">{message.content}</p>
                          {message.citation && (
                            <div className="mt-2 pt-2 border-t border-border/50">
                              <div className="flex items-center text-xs text-muted-foreground">
                                <FileText className="h-3 w-3 mr-1" />
                                <span>Source: {message.citation.document}</span>
                                {message.citation.page && (
                                  <span className="ml-1">(Page {message.citation.page})</span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="border-t border-border p-4">
                <div className="flex space-x-3">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask a question about your documents..."
                    className="flex-1 bg-background border-border focus:border-primary"
                  />
                  <Button 
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim()}
                    className="bg-primary hover:bg-primary-hover text-primary-foreground transition-smooth"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Press Enter to send, Shift+Enter for new line
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};