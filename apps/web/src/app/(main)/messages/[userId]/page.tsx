'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { io, Socket } from 'socket.io-client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, MoreHorizontal, Send, Phone, Video } from 'lucide-react';
import { getInitials, timeAgo } from '@/lib/utils';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface Message {
  id: string | number;
  senderId: string;
  receiverId?: string;
  content: string;
  createdAt: string | Date;
}

interface OtherUser {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  avatar?: string;
}

type ConversationPageProps = {
  params: Promise<{ userId: string }>;
};

function shouldShowTime(messages: Message[], index: number): boolean {
  if (index === 0) return true;
  const prev = new Date(messages[index - 1].createdAt).getTime();
  const curr = new Date(messages[index].createdAt).getTime();
  return curr - prev > 5 * 60 * 1000;
}

export default function ConversationPage({ params }: ConversationPageProps) {
  const { userId } = params as unknown as { userId: string };
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: conversation } = useQuery<{ data: Message[] }>({
    queryKey: ['messages', userId],
    queryFn: () => api.get(`/messages/${userId}`).then((r) => r.data),
  });

  useEffect(() => {
    if (conversation?.data) setMessages(conversation.data);
  }, [conversation]);

  const { data: otherUser } = useQuery<OtherUser>({
    queryKey: ['profile', userId],
    queryFn: () => api.get(`/users/${userId}`).then((r) => r.data),
  });

  useEffect(() => {
    const token = localStorage.getItem('edp_access_token');
    const s = io(`${process.env.NEXT_PUBLIC_API_URL}/messages`, { auth: { token } });
    s.on('new_message', (msg: Message) => {
      if (msg.senderId === userId || msg.receiverId === userId) {
        setMessages((prev) => [...prev, msg]);
      }
    });
    setSocket(s);
    return () => { s.disconnect(); };
  }, [userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim() || !socket) return;
    socket.emit('send_message', { receiverId: userId, content: input });
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), senderId: user?.id ?? '', content: input, createdAt: new Date() },
    ]);
    setInput('');
  };

  return (
    <div className="flex flex-col h-screen max-h-screen bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 bg-background/80 backdrop-blur-md border-b border-border/50 flex-shrink-0">
        <Link
          href="/messages"
          className="p-1.5 -ml-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
          aria-label="Retour"
        >
          <ArrowLeft size={20} />
        </Link>

        {otherUser ? (
          <Link href={`/profile/${otherUser.username}`} className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative flex-shrink-0">
              <Avatar className="h-9 w-9">
                <AvatarImage src={otherUser.avatar} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  {getInitials(otherUser.firstName, otherUser.lastName)}
                </AvatarFallback>
              </Avatar>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-background" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-heading font-semibold truncate">
                {otherUser.firstName} {otherUser.lastName}
              </p>
              <p className="text-[11px] text-emerald-500 font-medium">En ligne</p>
            </div>
          </Link>
        ) : (
          <div className="flex-1" />
        )}

        <div className="flex items-center gap-1 ml-auto">
          <button className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-all" aria-label="Appel vocal">
            <Phone size={18} />
          </button>
          <button className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-all" aria-label="Appel vidéo">
            <Video size={18} />
          </button>
          <button className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-all" aria-label="Options">
            <MoreHorizontal size={18} />
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {messages.map((msg, index) => {
          const isMe = msg.senderId === user?.id;
          const showTime = shouldShowTime(messages, index);
          const nextMsg = messages[index + 1];
          const isLast = !nextMsg || nextMsg.senderId !== msg.senderId;

          return (
            <div key={msg.id}>
              {showTime && (
                <p className="text-center text-[10px] text-muted-foreground/60 font-medium my-3 uppercase tracking-wider">
                  {timeAgo(msg.createdAt)}
                </p>
              )}
              <div className={cn('flex items-end gap-2', isMe ? 'justify-end' : 'justify-start', !isLast && 'mb-0.5')}>
                {!isMe && (
                  <div className="w-6 flex-shrink-0">
                    {isLast && otherUser && (
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={otherUser.avatar} />
                        <AvatarFallback className="bg-primary/10 text-primary text-[9px]">
                          {getInitials(otherUser.firstName, otherUser.lastName)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-[72%] px-4 py-2.5 text-sm leading-relaxed',
                    isMe
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-foreground',
                    isMe
                      ? isLast ? 'rounded-[20px_4px_20px_20px]' : 'rounded-[20px_20px_4px_20px]'
                      : isLast ? 'rounded-[4px_20px_20px_20px]' : 'rounded-[20px_20px_20px_4px]',
                  )}
                >
                  {msg.content}
                </div>
              </div>
            </div>
          );
        })}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-16">
            {otherUser && (
              <Avatar className="h-16 w-16">
                <AvatarImage src={otherUser.avatar} />
                <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                  {getInitials(otherUser.firstName, otherUser.lastName)}
                </AvatarFallback>
              </Avatar>
            )}
            <div>
              <p className="font-heading font-semibold text-foreground">
                {otherUser ? `${otherUser.firstName} ${otherUser.lastName}` : ''}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Démarrez la conversation</p>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-3 py-3 bg-background/80 backdrop-blur-md border-t border-border/50 flex gap-2 items-end">
        <div className="flex-1 flex items-center bg-secondary rounded-3xl px-4 min-h-[44px] py-2.5">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Message…"
            aria-label="Message"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60 resize-none"
          />
        </div>
        <button
          onClick={sendMessage}
          disabled={!input.trim()}
          aria-label="Envoyer"
          className={cn(
            'h-11 w-11 rounded-full flex-shrink-0 flex items-center justify-center transition-all duration-200',
            input.trim()
              ? 'bg-primary text-primary-foreground shadow-md hover:scale-105 active:scale-95'
              : 'bg-secondary text-muted-foreground',
          )}
        >
          <Send size={17} className={input.trim() ? 'translate-x-px' : ''} />
        </button>
      </div>
    </div>
  );
}
