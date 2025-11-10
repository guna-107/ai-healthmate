import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Activity, Send, Bot, User, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { logAIRequest } from "@/lib/ai-logger";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const AIChat = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I'm your AI Health Coach. How can I help you with your health goals today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversationIdRef = useRef<string>(crypto.randomUUID());
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!user || initialLoadDone) return;

    const loadChatHistory = async () => {
      try {
        // Get or create conversation for this user
        const { data: convData } = await supabase
          .from("conversations")
          .select("*")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle();

        let conversationId = convData?.id;

        if (!conversationId) {
          const { data: newConv } = await supabase
            .from("conversations")
            .insert({ user_id: user.id, title: "Health Chat" })
            .select()
            .single();
          conversationId = newConv?.id;
        }

        if (!conversationId) return;

        const { data, error } = await supabase
          .from("chat_messages")
          .select("*")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true })
          .limit(50);

        if (error) throw error;

        if (data && data.length > 0) {
          const loadedMessages = data.map((msg: any) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.created_at),
          }));
          setMessages(loadedMessages);
          if (data.length > 0) {
            conversationIdRef.current = data[0].conversation_id;
          }
        }
        setInitialLoadDone(true);
      } catch (error) {
        console.error("Failed to load chat history:", error);
        setInitialLoadDone(true);
      }
    };

    loadChatHistory();
  }, [user, initialLoadDone]);

  const suggestedPrompts = [
    "What should I eat for breakfast?",
    "How can I increase my protein intake?",
    "Give me a quick workout routine",
    "Help me meal prep for the week",
  ];

  const handleSend = async () => {
    if (!input.trim() || loading || !user) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    await supabase.from("chat_messages").insert({
      user_id: user.id,
      conversation_id: conversationIdRef.current,
      role: "user",
      content: userMessage.content,
    });

    const startTime = performance.now();
    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.map(m => ({ role: m.role, content: m.content })).concat([{ role: userMessage.role, content: userMessage.content }])
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to get response');
      }

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";

      const assistantMsgId = crypto.randomUUID();
      setMessages((prev) => [...prev, {
        id: assistantMsgId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
      }]);

      let textBuffer = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages((prev) => {
                const newMessages = [...prev];
                const lastMsg = newMessages[newMessages.length - 1];
                if (lastMsg.role === "assistant") {
                  lastMsg.content = assistantContent;
                }
                return newMessages;
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      const responseTime = performance.now() - startTime;

      await supabase.from("chat_messages").insert({
        user_id: user.id,
        conversation_id: conversationIdRef.current,
        role: "assistant",
        content: assistantContent,
      });

      await logAIRequest({
        requestType: "chat",
        responseTimeMs: Math.round(responseTime),
        status: "success",
      });

    } catch (error: any) {
      const responseTime = performance.now() - startTime;
      await logAIRequest({
        requestType: "chat",
        responseTimeMs: Math.round(responseTime),
        status: "error",
        errorMessage: error.message,
      });

      console.error("Chat error:", error);
      toast({
        title: "Chat error",
        description: error.message || "Failed to get AI response",
        variant: "destructive",
      });
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestedPrompt = (prompt: string) => {
    setInput(prompt);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/dashboard")}>
            <Activity className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold">AI Health Coach</span>
          </div>
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            Close
          </Button>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6 flex flex-col max-w-4xl">
        <div className="flex-1 overflow-y-auto space-y-6 mb-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {message.role === "assistant" && (
                <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-primary-foreground" />
                </div>
              )}
              <Card
                className={`max-w-[80%] p-4 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card"
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                <p className="text-xs opacity-70 mt-2">
                  {message.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </Card>
              {message.role === "user" && (
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-secondary-foreground" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-primary-foreground" />
              </div>
              <Card className="max-w-[80%] p-4 bg-card">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                </div>
              </Card>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {messages.length === 1 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
              <Sparkles className="w-4 h-4" />
              <span>Suggested prompts:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {suggestedPrompts.map((prompt, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="justify-start text-left h-auto py-3"
                  onClick={() => handleSuggestedPrompt(prompt)}
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 items-end">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about nutrition, fitness, or health..."
            className="flex-1"
            disabled={loading}
          />
          <Button onClick={handleSend} disabled={loading || !input.trim()} variant="hero">
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </main>
    </div>
  );
};

export default AIChat;
