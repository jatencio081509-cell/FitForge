import { AppLayout } from "@/components/layout";
import { useAiChat, useAiGenerateWorkout } from "@workspace/api-client-react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Bot, Send, User, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

type Message = { role: "user" | "coach", content: string };

export default function AiCoach() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "coach", content: "Hey! I'm your FitForge AI Coach. How can I help you smash your goals today?" }
  ]);
  const [input, setInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const aiChat = useAiChat();
  const generateWorkout = useAiGenerateWorkout();

  const [genWorkoutData, setGenWorkoutData] = useState({ goal: "muscle_gain", fitnessLevel: "intermediate" });
  const [genOpen, setGenOpen] = useState(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || aiChat.isPending) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setInput("");

    aiChat.mutate({ data: { message: userMsg } }, {
      onSuccess: (res) => {
        setMessages(prev => [...prev, { role: "coach", content: res.reply }]);
      }
    });
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    generateWorkout.mutate({ data: genWorkoutData }, {
      onSuccess: () => {
        setGenOpen(false);
        setMessages(prev => [...prev, { role: "coach", content: "I've generated a new workout plan based on your parameters! Check it out in the Workouts tab." }]);
      }
    });
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto h-[calc(100vh-6rem)] flex flex-col">
        <div className="flex justify-between items-center mb-6 shrink-0">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">AI Coach</h1>
            <p className="text-muted-foreground text-lg">Expert advice, instantly.</p>
          </div>

          <Dialog open={genOpen} onOpenChange={setGenOpen}>
            <DialogTrigger asChild>
              <Button className="shadow-lg shadow-primary/20 bg-primary text-primary-foreground">
                <Sparkles className="w-5 h-5 mr-2" />
                Generate Workout
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>AI Workout Generation</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleGenerate} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Primary Goal</Label>
                  <Select value={genWorkoutData.goal} onValueChange={v => setGenWorkoutData({...genWorkoutData, goal: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="muscle_gain">Muscle Gain</SelectItem>
                      <SelectItem value="fat_loss">Fat Loss</SelectItem>
                      <SelectItem value="strength">Strength</SelectItem>
                      <SelectItem value="endurance">Endurance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fitness Level</Label>
                  <Select value={genWorkoutData.fitnessLevel} onValueChange={v => setGenWorkoutData({...genWorkoutData, fitnessLevel: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={generateWorkout.isPending}>
                  {generateWorkout.isPending ? "Generating..." : "Generate Magic"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="flex-1 flex flex-col bg-card/50 backdrop-blur border-border overflow-hidden">
          <CardContent className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-4 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'coach' && (
                  <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
                    <Bot className="w-5 h-5 text-primary" />
                  </div>
                )}
                <div className={`px-5 py-3 rounded-2xl max-w-[80%] leading-relaxed ${
                  m.role === 'user' 
                    ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                    : 'bg-accent/50 text-foreground border border-border rounded-tl-sm'
                }`}>
                  {m.content}
                </div>
                {m.role === 'user' && (
                  <div className="w-10 h-10 rounded-full bg-muted border border-border flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
            {aiChat.isPending && (
              <div className="flex gap-4 justify-start">
                <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
                <div className="px-5 py-3 rounded-2xl bg-accent/50 text-foreground border border-border flex items-center gap-2 rounded-tl-sm">
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </CardContent>
          
          <div className="p-4 bg-background border-t border-border shrink-0">
            <form onSubmit={handleSend} className="relative flex items-center">
              <Input 
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask about form, routines, or nutrition..." 
                className="pr-14 h-14 text-lg bg-card border-border rounded-full"
                disabled={aiChat.isPending}
              />
              <Button type="submit" size="icon" className="absolute right-2 rounded-full" disabled={!input.trim() || aiChat.isPending}>
                <Send className="w-5 h-5 ml-0.5" />
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}