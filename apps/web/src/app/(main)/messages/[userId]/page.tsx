'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { io, Socket } from 'socket.io-client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Send, ArrowLeft, MoreHorizontal } from 'lucide-react';
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

export default function ConversationPage({ params }: ConversationPageProps) {
  // Note: In client components, params is passed as a resolved object, not a Promise
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
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card flex-shrink-0">
        <Link
          href="/messages"
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Retour aux messages"
        >
          <ArrowLeft size={20} aria-hidden="true" />
        </Link>

        {otherUser && (
          <>
            <Avatar className="h-9 w-9 flex-shrink-0">
              <AvatarImage src={otherUser.avatar} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                {getInitials(otherUser.firstName, otherUser.lastName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-heading font-semibold truncate">
                {otherUser.firstName} {otherUser.lastName}
              </p>
            </div>
          </>
        )}

        <button
          className="text-muted-foreground hover:text-foreground transition-colors ml-auto"
          aria-label="Plus d'options"
        >
          <MoreHorizontal size={20} aria-hidden="true" />
        </button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {messages.map((msg) => {
          const isMe = msg.senderId === user?.id;
          return (
            <div key={msg.id} className={cn('flex', isMe ? 'justify-end' : 'justify-start')}>
              <div
                className={cn(
                  'max-w-[72%] px-4 py-2.5 text-sm',
                  isMe ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground',
                )}
                style={{
                  borderRadius: isMe ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                }}
              >
                <p>{msg.content}</p>
                <p className={cn(
                  'text-xs mt-1',
                  isMe ? 'text-primary-foreground/60 text-right' : 'text-muted-foreground',
                )}>
                  {timeAgo(msg.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-border bg-card flex gap-2 items-center">
        <div className="flex-1 flex items-center bg-secondary rounded-full px-4 h-11">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Votre message..."
            aria-label="Message"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <Button
          onClick={sendMessage}
          disabled={!input.trim()}
          size="icon"
          className="h-11 w-11 rounded-full flex-shrink-0"
          aria-label="Envoyer"
        >
          <Send size={18} aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
