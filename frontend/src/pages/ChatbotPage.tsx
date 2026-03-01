import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Send,
  Bot,
  User as UserIcon,
  Plus,
  Trash2,
  MessageSquareText,
  Sparkles,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/Button';
import api from '../api/client';
import { ChatConversation, ChatMessage } from '../types';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const mapConversation = (raw: any): ChatConversation => ({
  id: String(raw?._id || raw?.id || ''),
  title: raw?.title || 'New Chat',
  lastMessage: raw?.lastMessage || '',
  lastMessageAt: raw?.lastMessageAt || raw?.updatedAt,
  messageCount: Number(raw?.messageCount || 0),
  createdAt: raw?.createdAt || new Date().toISOString()
});

const mapMessage = (raw: any): ChatMessage => ({
  id: String(raw?._id || raw?.id || ''),
  role: raw?.role,
  content: raw?.message || raw?.content || '',
  timestamp: raw?.createdAt || raw?.timestamp || new Date().toISOString()
});

const formatMessage = (text: string) => {
  let formatted = text.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold">$1</strong>');
  formatted = formatted.split('\n').map(line => {
    if (/^\d+\.\s+/.test(line)) {
      return `<div class="my-2">${line}</div>`;
    }
    return line;
  }).join('\n');
  formatted = formatted.replace(/\n\n/g, '<br/><br/>');
  formatted = formatted.replace(/\n/g, '<br/>');
  return formatted;
};

const ChatbotPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user, isStudent, isStaff, isAdmin } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [input, setInput] = React.useState('');
  const [selectedConversationId, setSelectedConversationId] = React.useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [isStartingNewChat, setIsStartingNewChat] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const userKey = user?.id || 'anonymous';

  const conversationsQuery = useQuery({
    queryKey: ['chat', 'conversations', userKey],
    queryFn: async () => {
      const response = await api.get('/api/chatbot/conversations');
      return (response.data.data || []).map(mapConversation) as ChatConversation[];
    },
    enabled: Boolean(user?.id)
  });

  const healthQuery = useQuery({
    queryKey: ['public', 'health'],
    queryFn: async () => {
      const response = await api.get('/api/public/health');
      return response.data?.data || {};
    }
  });

  React.useEffect(() => {
    if (!selectedConversationId && !isStartingNewChat && conversationsQuery.data && conversationsQuery.data.length > 0) {
      setSelectedConversationId(conversationsQuery.data[0].id);
    }
  }, [conversationsQuery.data, selectedConversationId, isStartingNewChat]);

  React.useEffect(() => {
    setSelectedConversationId(null);
    setInput('');
    setIsStartingNewChat(false);
  }, [userKey]);

  const messagesQuery = useQuery({
    queryKey: ['chat', 'messages', userKey, selectedConversationId],
    queryFn: async () => {
      const response = await api.get(`/api/chatbot/conversations/${selectedConversationId}/messages`);
      return (response.data.data?.messages || []).map(mapMessage) as ChatMessage[];
    },
    enabled: Boolean(selectedConversationId && user?.id)
  });

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messagesQuery.data]);

  const createConversationMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/api/chatbot/conversations');
      return mapConversation(response.data.data);
    },
    onSuccess: (conversation) => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations', userKey] });
      setSelectedConversationId(conversation.id);
      setIsStartingNewChat(false);
      setInput('');
    },
    onError: () => {
      setIsStartingNewChat(false);
    }
  });

  const clearConversationMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      await api.delete(`/api/chatbot/conversations/${conversationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations', userKey] });
      queryClient.removeQueries({ queryKey: ['chat', 'messages', userKey, selectedConversationId] });
      setSelectedConversationId(null);
    }
  });

  const clearAllMutation = useMutation({
    mutationFn: async () => {
      await api.delete('/api/chatbot/conversations');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations', userKey] });
      queryClient.removeQueries({ queryKey: ['chat', 'messages', userKey] });
      setSelectedConversationId(null);
    }
  });

  const chatMutation = useMutation({
    mutationFn: async ({ message, conversationId }: { message: string; conversationId?: string }) => {
      const response = await api.post('/api/chatbot', { message, conversationId });
      return response.data.data as { conversationId: string; message: string };
    },
    onSuccess: (payload) => {
      setSelectedConversationId(String(payload.conversationId));
      setInput('');
      setIsStartingNewChat(false);
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations', userKey] });
      queryClient.invalidateQueries({ queryKey: ['chat', 'messages', userKey, String(payload.conversationId)] });
    }
  });

  const handleNewChat = () => {
    setIsStartingNewChat(true);
    setSelectedConversationId(null);
    setInput('');
    createConversationMutation.mutate();
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || chatMutation.isPending) return;
    chatMutation.mutate({ message: trimmed, conversationId: selectedConversationId || undefined });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 200) + 'px';
    }
  }, [input]);

  const messages = messagesQuery.data || [];

  const suggestedPrompts = React.useMemo(() => {
    if (isAdmin) {
      return [
        "Show me analytics for complaint categories",
        "How can I monitor department performance?",
        "List unresolved complaints older than 7 days",
        "How should I manage user roles in the system?"
      ];
    }
    if (isStaff) {
      return [
        "Show complaints assigned to my department",
        "How do I update complaint status?",
        "When should I add a remark to a complaint?",
        "Explain the workflow for resolving a complaint"
      ];
    }
    // student
    return [
      "How do I submit a complaint?",
      "Check my complaint status",
      "What are the complaint categories?",
      "How does the complaint tracking work?"
    ];
  }, [isAdmin, isStaff, isStudent]);

  const assistantSubtitle = React.useMemo(() => {
    if (isAdmin) return 'Admin complaint insights and guidance';
    if (isStaff) return 'Department complaint workflow support';
    return 'Complaint filing and tracking support';
  }, [isAdmin, isStaff]);

  return (
    <div className="relative h-[calc(100vh-8rem)] min-h-[620px] overflow-hidden rounded-2xl border border-white/20 shadow-2xl dark:border-slate-800/70">
      {/* Background Image (subtly visible in light + dark) */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: isDark
            ? "linear-gradient(135deg, rgba(2,6,23,0.78) 0%, rgba(2,6,23,0.72) 45%, rgba(6,95,70,0.62) 100%), radial-gradient(900px 500px at 15% 0%, rgba(16,185,129,0.18), transparent 60%), url('/images/astu-main-building.jpg')"
            : "linear-gradient(135deg, rgba(248,250,252,0.68) 0%, rgba(241,245,249,0.58) 45%, rgba(16,185,129,0.20) 100%), radial-gradient(900px 500px at 15% 0%, rgba(16,185,129,0.16), transparent 60%), url('/images/astu-main-building.jpg')",
          backgroundSize: 'cover, cover, cover',
          backgroundPosition: 'center, center, center',
          backgroundRepeat: 'no-repeat, no-repeat, no-repeat',
          backgroundAttachment: 'fixed, fixed, fixed'
        }}
      />

      {/* Two-column layout (sidebar does NOT overlay chat) */}
      <div className="relative z-10 flex h-full w-full">
        <motion.aside
          animate={{ width: isSidebarOpen ? 300 : 0 }}
          transition={{ type: 'spring', damping: 26, stiffness: 220 }}
          className="h-full shrink-0 overflow-hidden border-r border-white/20 bg-white/80 backdrop-blur-2xl dark:border-slate-800/70 dark:bg-slate-900/70"
        >
          <div
            className={cn(
              'flex h-full w-[300px] flex-col p-3 transition-opacity',
              isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
            )}
          >
            <Button
              className="w-full mb-3"
              onClick={handleNewChat}
              isLoading={createConversationMutation.isPending}
            >
              <Plus size={18} className="mr-2" />
              New Chat
            </Button>

            <div className="flex-1 overflow-y-auto">
              <p className="mb-2 px-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                Recent
              </p>
              {conversationsQuery.data?.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => setSelectedConversationId(conversation.id)}
                  className={cn(
                    'mb-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                    selectedConversationId === conversation.id
                      ? 'bg-slate-100 font-medium text-slate-900 dark:bg-slate-800 dark:text-slate-100'
                      : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50'
                  )}
                >
                  <MessageSquareText size={16} className="shrink-0" />
                  <span className="flex-1 truncate">{conversation.title}</span>
                </button>
              ))}
              {conversationsQuery.data?.length === 0 && (
                <p className="px-3 py-8 text-center text-sm text-slate-400">
                  No conversations yet
                </p>
              )}
            </div>

            <div className="space-y-1 border-t border-slate-200/60 pt-3 dark:border-slate-800/70">
              <button
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-100/70 dark:text-slate-400 dark:hover:bg-slate-800/60"
                disabled={!selectedConversationId}
                onClick={() => selectedConversationId && clearConversationMutation.mutate(selectedConversationId)}
              >
                <Trash2 size={16} />
                Clear Chat
              </button>
              <button
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-100/70 dark:text-slate-400 dark:hover:bg-slate-800/60"
                onClick={() => clearAllMutation.mutate()}
              >
                <Trash2 size={16} />
                Clear All
              </button>
            </div>
          </div>
        </motion.aside>

        {/* Main Chat Area */}
        <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-white/20 bg-white/70 backdrop-blur-2xl px-4 py-3 dark:border-slate-800/70 dark:bg-slate-900/70">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-sm">
              <Sparkles size={18} />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                ASTU Smart Assistant
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {assistantSubtitle}
              </p>
            </div>
          </div>
        </div>

        {healthQuery.data && !healthQuery.data.geminiConfigured && (
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
            GEMINI_API_KEY is not configured. Chatbot responses are currently unavailable.
          </div>
        )}

        {/* Messages Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          {!selectedConversationId || messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center px-4 pb-32">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg">
                <Sparkles size={32} className="text-white" />
              </div>
              <h2 className="mb-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
                How can I help you today?
              </h2>
              <p className="mb-8 text-center text-slate-500 dark:text-slate-400">
                Ask me about the ASTU complaint system
              </p>
              
              <div className="grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
                {suggestedPrompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setInput(prompt);
                      inputRef.current?.focus();
                    }}
                    className="rounded-xl border border-white/20 bg-white/75 backdrop-blur-xl p-4 text-left text-sm transition-all hover:border-emerald-300 hover:shadow-md dark:border-slate-800/70 dark:bg-slate-900/70 dark:hover:border-emerald-700"
                  >
                    <div className="font-medium text-slate-900 dark:text-slate-100">{prompt}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl px-4 py-6">
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={cn(
                      'mb-6 flex gap-4',
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {msg.role === 'assistant' && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-sm">
                        <Bot size={18} />
                      </div>
                    )}
                    
                    <div className={cn('max-w-[85%] space-y-2')}>
                      <div
                        className={cn(
                          'rounded-2xl px-4 py-3 text-[15px] leading-relaxed',
                          msg.role === 'assistant'
                            ? 'bg-slate-100/80 backdrop-blur-sm text-slate-900 dark:bg-slate-800/80 dark:text-slate-100'
                            : 'bg-emerald-600 text-white shadow-sm'
                        )}
                      >
                        {msg.role === 'assistant' ? (
                          <div 
                            className="whitespace-pre-wrap break-words [&_strong]:font-semibold [&_strong]:text-slate-900 dark:[&_strong]:text-slate-100"
                            dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                          />
                        ) : (
                          <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                        )}
                      </div>
                      <div className={cn(
                        'flex items-center gap-2 px-1 text-xs text-slate-400',
                        msg.role === 'user' ? 'justify-end' : 'justify-start'
                      )}>
                        <span>
                          {new Date(msg.timestamp).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                    </div>

                    {msg.role === 'user' && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                        <UserIcon size={18} />
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {chatMutation.isPending && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 flex gap-4"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-sm">
                    <Bot size={18} />
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl bg-slate-100/80 backdrop-blur-sm px-4 py-3 dark:bg-slate-800/80">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:0ms]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:150ms]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:300ms]" />
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-white/20 bg-white/70 backdrop-blur-2xl px-4 py-4 dark:border-slate-800/70 dark:bg-slate-900/70">
          <div className="mx-auto max-w-3xl">
            <div className="relative flex items-end gap-2 rounded-2xl border border-slate-200 bg-white/90 backdrop-blur-sm p-2 shadow-sm transition-all focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800/90">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message ASTU Assistant..."
                rows={1}
                disabled={chatMutation.isPending}
                className="max-h-[200px] min-h-[24px] flex-1 resize-none bg-transparent px-2 py-2 text-[15px] text-slate-900 placeholder-slate-400 focus:outline-none dark:text-slate-100 dark:placeholder-slate-500"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || chatMutation.isPending}
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all',
                  input.trim() && !chatMutation.isPending
                    ? 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700'
                    : 'bg-slate-200 text-slate-400 dark:bg-slate-700 dark:text-slate-500'
                )}
              >
                <Send size={18} />
              </button>
            </div>
            <p className="mt-2 text-center text-xs text-slate-400 dark:text-slate-500">
              ASTU Assistant can make mistakes. Please verify important information.
            </p>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default ChatbotPage;
