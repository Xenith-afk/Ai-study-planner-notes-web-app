import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { GraduationCap, Send, Eraser, Sparkles, AlertTriangle } from "lucide-react";
import { useRateLimit } from "@/hooks/useRateLimit";
type Message = { role: "user" | "assistant"; content: string };

const QUICK_PROMPTS = [
  "Explain this concept simply",
  "Give me an example",
  "What are common mistakes?",
  "How do I remember this?",
  "Why is this important?",
];

export const AITutor = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { isLimited, remainingRequests, recordRequest, getTimeUntilReset } = useRateLimit({
    maxRequests: 15,
    windowMs: 60000, // 15 requests per minute
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (messageText?: string) => {
    const userMessage = messageText || input.trim();
    if (!userMessage || loading) return;

    if (!recordRequest()) {
      const resetSeconds = Math.ceil(getTimeUntilReset() / 1000);
      toast.error(`Rate limit exceeded. Please wait ${resetSeconds} seconds.`);
      return;
    }

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-with-notes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            message: userMessage,
            conversationHistory: [
              { 
                role: "system", 
                content: `You are an expert AI tutor. Your role is to:
1. Explain concepts clearly and thoroughly
2. Use examples and analogies to make things understandable
3. Break down complex topics into simple steps
4. Encourage the student and be supportive
5. Ask follow-up questions to ensure understanding
6. Provide memory techniques when helpful
7. Connect new concepts to things they might already know

Be patient, encouraging, and thorough. If the student seems confused, try a different approach.`
              },
              ...messages.slice(-10),
            ],
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          toast.error("Rate limit reached. Please try again in a moment.");
          return;
        }
        throw new Error("Failed to get response");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") break;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                assistantMessage += content;
                setMessages((prev) => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1].content = assistantMessage;
                  return newMessages;
                });
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      toast.error("Failed to get response from tutor");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    toast.success("Chat cleared");
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-2 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <GraduationCap className="w-5 h-5 text-primary" />
            AI Study Tutor
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={clearChat}>
            <Eraser className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Ask any question - I'm here to help you learn!
        </p>
        {isLimited && (
          <Alert variant="destructive" className="mt-2">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Rate limit reached. Wait {Math.ceil(getTimeUntilReset() / 1000)}s before sending more messages.
            </AlertDescription>
          </Alert>
        )}
        {!isLimited && remainingRequests <= 5 && (
          <p className="text-xs text-muted-foreground mt-1">
            {remainingRequests} requests remaining this minute
          </p>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-center p-4">
              <div className="space-y-4">
                <GraduationCap className="w-12 h-12 mx-auto text-muted-foreground/50" />
                <div>
                  <p className="font-medium">Hi! I'm your AI tutor</p>
                  <p className="text-sm text-muted-foreground">
                    Ask me anything about your studies
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {QUICK_PROMPTS.slice(0, 3).map((prompt) => (
                    <Badge
                      key={prompt}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                      onClick={() => sendMessage(prompt)}
                    >
                      <Sparkles className="w-3 h-3 mr-1" />
                      {prompt}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg p-3 ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg p-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-primary animate-bounce" />
                      <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:0.2s]" />
                      <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Quick prompts when chatting */}
        {messages.length > 0 && (
          <div className="px-4 pb-2 flex gap-2 overflow-x-auto">
            {QUICK_PROMPTS.map((prompt) => (
              <Badge
                key={prompt}
                variant="outline"
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors whitespace-nowrap text-xs"
                onClick={() => sendMessage(prompt)}
              >
                {prompt}
              </Badge>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Ask your question..."
              className="resize-none min-h-[60px]"
              rows={2}
            />
            <Button 
              onClick={() => sendMessage()} 
              disabled={loading || !input.trim()}
              className="h-auto"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
