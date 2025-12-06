import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Send, Brain, Sparkles, BookOpen, Zap, Baby, GraduationCap, Target, Calendar, FileQuestion, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AdaptiveLearningAI } from "@/components/AdaptiveLearningAI";
import { AITutor } from "@/components/AITutor";
import { SpacedRepetition } from "@/components/SpacedRepetition";
import { MockExamTraining } from "@/components/MockExamTraining";

type Message = { role: "user" | "assistant"; content: string };
type Mode = "chat" | "notes" | "flashcards" | "summary" | "child" | "expert";

const AIRoom = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<Mode>("chat");
  const [activeTab, setActiveTab] = useState("chat");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getModeConfig = () => {
    switch (mode) {
      case "child":
        return {
          icon: Baby,
          title: "Child Mode",
          description: "Simple, easy explanations",
          systemPrompt: "You are a friendly teacher explaining things to a 10-year-old. Use simple language, analogies, and examples. Break down complex topics into bite-sized, fun explanations.",
        };
      case "expert":
        return {
          icon: GraduationCap,
          title: "Expert Mode",
          description: "Deep, detailed explanations",
          systemPrompt: "You are an expert professor providing in-depth, comprehensive explanations. Include technical details, advanced concepts, formulas, and academic references. Be thorough and precise.",
        };
      case "notes":
        return {
          icon: BookOpen,
          title: "Notes Generator",
          description: "Structured study notes",
          systemPrompt: "Generate well-structured study notes with key points, definitions, formulas, and examples. Format clearly with headings and bullet points.",
        };
      case "flashcards":
        return {
          icon: Zap,
          title: "Flashcards Creator",
          description: "Q&A flashcards",
          systemPrompt: "Create flashcard-style Q&A pairs for effective memorization. Each answer should be concise and clear.",
        };
      case "summary":
        return {
          icon: Sparkles,
          title: "Summarizer",
          description: "Quick summaries",
          systemPrompt: "Provide concise, clear summaries highlighting the most important points. Keep it brief but comprehensive.",
        };
      default:
        return {
          icon: Brain,
          title: "AI Assistant",
          description: "Ask anything",
          systemPrompt: "You are a helpful study assistant. Answer questions clearly and help students understand concepts better.",
        };
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const config = getModeConfig();
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
              { role: "system", content: config.systemPrompt },
              ...messages.slice(-6),
            ],
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to get response");

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
    } catch (error: any) {
      toast.error("Failed to get response");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const config = getModeConfig();
  const ModeIcon = config.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="container mx-auto max-w-5xl">
        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-[calc(100vh-2rem)]">
          <TabsList className="grid w-full grid-cols-5 mb-4">
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Chat</span>
            </TabsTrigger>
            <TabsTrigger value="tutor" className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              <span className="hidden sm:inline">Tutor</span>
            </TabsTrigger>
            <TabsTrigger value="adaptive" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              <span className="hidden sm:inline">Adaptive</span>
            </TabsTrigger>
            <TabsTrigger value="spaced" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Review</span>
            </TabsTrigger>
            <TabsTrigger value="exam" className="flex items-center gap-2">
              <FileQuestion className="w-4 h-4" />
              <span className="hidden sm:inline">Exam</span>
            </TabsTrigger>
          </TabsList>

          {/* Chat Tab */}
          <TabsContent value="chat" className="h-[calc(100%-60px)] mt-0">
            <Card className="h-full flex flex-col">
              {/* Header */}
              <div className="border-b p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                      <ModeIcon className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{config.title}</h2>
                      <p className="text-sm text-muted-foreground">{config.description}</p>
                    </div>
                  </div>
                </div>

                {/* Mode Selector */}
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant={mode === "chat" ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setMode("chat")}
                  >
                    <Brain className="w-3 h-3 mr-1" />
                    Chat
                  </Badge>
                  <Badge
                    variant={mode === "child" ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setMode("child")}
                  >
                    <Baby className="w-3 h-3 mr-1" />
                    Child Mode
                  </Badge>
                  <Badge
                    variant={mode === "expert" ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setMode("expert")}
                  >
                    <GraduationCap className="w-3 h-3 mr-1" />
                    Expert Mode
                  </Badge>
                  <Badge
                    variant={mode === "notes" ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setMode("notes")}
                  >
                    <BookOpen className="w-3 h-3 mr-1" />
                    Notes
                  </Badge>
                  <Badge
                    variant={mode === "flashcards" ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setMode("flashcards")}
                  >
                    <Zap className="w-3 h-3 mr-1" />
                    Flashcards
                  </Badge>
                  <Badge
                    variant={mode === "summary" ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setMode("summary")}
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    Summary
                  </Badge>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-center">
                    <div className="space-y-2 text-muted-foreground">
                      <ModeIcon className="w-12 h-12 mx-auto opacity-50" />
                      <p className="text-lg font-medium">Start chatting!</p>
                      <p className="text-sm">Ask any question or request help with your studies</p>
                    </div>
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  ))
                )}
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

              {/* Input */}
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder={`Ask anything in ${config.title}...`}
                    className="resize-none"
                    rows={2}
                  />
                  <Button onClick={handleSend} disabled={loading || !input.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* AI Tutor Tab */}
          <TabsContent value="tutor" className="h-[calc(100%-60px)] mt-0">
            <AITutor />
          </TabsContent>

          {/* Adaptive Learning Tab */}
          <TabsContent value="adaptive" className="h-[calc(100%-60px)] mt-0 overflow-y-auto">
            <AdaptiveLearningAI />
          </TabsContent>

          {/* Spaced Repetition Tab */}
          <TabsContent value="spaced" className="h-[calc(100%-60px)] mt-0">
            <SpacedRepetition />
          </TabsContent>

          {/* Mock Exam Tab */}
          <TabsContent value="exam" className="h-[calc(100%-60px)] mt-0">
            <MockExamTraining />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AIRoom;
