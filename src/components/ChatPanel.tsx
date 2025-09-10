import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, FileText, MessageSquare } from "lucide-react";
import { useProject } from "@/contexts/ProjectContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Message {
  id: string;
  project_id: string;
  type: 'user' | 'ai';
  content: string;
  created_at: string;
  citation_document?: string;
  citation_page?: number;
}

export const ChatPanel = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { currentProject } = useProject();
  const { user } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async () => {
    if (!currentProject || !user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('project_id', currentProject.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data && data.length === 0) {
        // Add welcome message for new projects
        const welcomeMessage: Message = {
          id: 'welcome',
          project_id: currentProject.id,
          type: 'ai',
          content: "Hello! I'm your AI document assistant. Upload some documents and I'll help you find answers, summaries, and insights from your files.",
          created_at: new Date().toISOString(),
        };
        setMessages([welcomeMessage]);
      } else {
        setMessages((data || []).map(item => ({
          ...item,
          type: item.type as 'user' | 'ai'
        })));
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    fetchMessages();
  }, [currentProject, user]);

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: {citation_document:string | null; 
                                    citation_page: number | null;
                                    content: string;
                                    created_at: string;
                                    id: string;
                                    project_id: string;
                                    type: string;
                                    user_id: string}) => {
      const response = await apiRequest('POST', 'http://localhost:5001/api/chat/messages', {
        collection: `${messageData.user_id}_${messageData.project_id}`,
        message: messageData.content,
      });
      return response.json();
    },
    onSuccess: async (data) => {
      console.log(data)

      if (data.success){
        console.log("here")
        const { data: aiMessage, error: aiError } = await supabase
          .from('chat_messages')
          .insert({
            project_id: currentProject.id,
            user_id: user.id,
            type: 'ai',
            content: data.response,
            citation_document: null,
            citation_page: null
          })
          .select()
          .single();

        if (aiError) throw aiError;

        // Add empty AI message first
        const emptyAiMessage = {
          ...aiMessage,
          content: '',
          type: aiMessage.type as 'user' | 'ai'
        };
        
        setMessages(prev => [...prev, emptyAiMessage]);

        // Stream the content character by character
        const fullResponse = data.response;
        let currentIndex = 0;

        const streamText = () => {
          if (currentIndex < fullResponse.length) {
            const nextChar = fullResponse[currentIndex];
            setMessages(prev => 
              prev.map(msg => 
                msg.id === aiMessage.id 
                  ? { ...msg, content: msg.content + nextChar }
                  : msg
              )
            );
            currentIndex++;
            setTimeout(streamText, 30); // Adjust speed here (30ms per character)
          } else {
            setIsTyping(false);
          }
        };

        streamText();
      }
      else{
        setIsTyping(false);
        throw data.response
      }

    },
    onSettled: (data, error) => {
      setIsTyping(false);
    }
  });

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !currentProject || !user) return;

    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      project_id: currentProject.id,
      type: 'user',
      content: inputValue,
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue("");
    setIsTyping(true);

    try {
      // Save user message to database
      const { data: savedUserMessage, error: userError } = await supabase
        .from('chat_messages')
        .insert({
          project_id: currentProject.id,
          user_id: user.id,
          type: 'user',
          content: currentInput
        })
        .select()
        .single();

      if (userError) throw userError;

      // Replace temp message with saved one
      setMessages(prev => prev.map(m => m.id === userMessage.id ? {
        ...savedUserMessage,
        type: savedUserMessage.type as 'user' | 'ai'
      } : m));

      sendMessageMutation.mutate(savedUserMessage);
      // // Simulate AI response
      // setTimeout(async () => {
      //   const aiContent = `I understand you're asking about "${currentInput}". Once you upload some documents, I'll be able to search through them and provide detailed answers with specific citations.`;
        
      //   const { data: aiMessage, error: aiError } = await supabase
      //     .from('chat_messages')
      //     .insert({
      //       project_id: currentProject.id,
      //       user_id: user.id,
      //       type: 'ai',
      //       content: aiContent,
      //       citation_document: null,
      //       citation_page: null
      //     })
      //     .select()
      //     .single();

      //   if (aiError) throw aiError;

      //   setMessages(prev => [...prev, {
      //     ...aiMessage,
      //     type: aiMessage.type as 'user' | 'ai'
      //   }]);
      //   setIsTyping(false);
      // }, 1200);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!currentProject) {
    return (
      <Card className="h-full flex flex-col">
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No project selected</p>
            <p className="text-xs">Select a project to start chatting</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-lg">
          <MessageSquare className="h-5 w-5 text-primary" />
          <span>Chat Assistant</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 min-h-0">
        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4 pb-4">
            {loading && (
              <div className="flex justify-center py-4">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
              </div>
            )}
            {!loading && messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start space-x-2 max-w-[85%] ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
                    message.type === 'user' ? 'bg-primary' : 'bg-secondary'
                  }`}>
                    {message.type === 'user' ? (
                      <User className="h-4 w-4 text-primary-foreground" />
                    ) : (
                      <Bot className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div className={`rounded-lg px-3 py-2 ${
                    message.type === 'user' 
                      ? 'chat-message-user' 
                      : 'chat-message-ai border border-border'
                  }`}>
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    {message.citation_document && (
                      <div className="mt-2 pt-2 border-t border-border/50">
                        <div className="flex items-center text-xs text-muted-foreground">
                          <FileText className="h-3 w-3 mr-1" />
                          <span>Source: {message.citation_document}</span>
                          {message.citation_page && (
                            <span className="ml-1">(Page {message.citation_page})</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-2">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center bg-secondary">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="chat-message-ai border border-border rounded-lg px-3 py-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="border-t border-border p-4">
          <div className="flex space-x-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about your documents..."
              className="flex-1 bg-background border-border focus:border-primary"
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isTyping}
              size="sm"
              className="bg-primary hover:bg-primary-hover text-primary-foreground px-3"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Press Enter to send • Shift+Enter for new line
          </p>
        </div>
      </CardContent>
    </Card>
  );
};