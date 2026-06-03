'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { io, Socket } from 'socket.io-client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, ArrowLeft } from 'lucide-react';
import { getInitials, timeAgo } from '@/lib/utils';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function ConversationPage({ params }: { params: any }) {
  const { userId } = params as { userId: string };
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: conversation } = useQuery({
    queryKey: ['messages', userId],
    queryFn: () => api.get(`/messages/${userId}`).then((r) => r.data),
  });

  useEffect(() => {
    if (conversation?.data) setMessages(conversation.data);
  }, [conversation]);

  const { data: otherUser } = useQuery({
    queryKey: ['profile', userId],
    queryFn: () => api.get(`/users/${userId}`).then((r) => r.data),
  });

  useEffect(() => {
    const token = localStorage.getItem('edp_access_token');
    const s = io(`${process.env.NEXT_PUBLIC_API_URL}/messages`, { auth: { token } });
    s.on('new_message', (msg: any) => {
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
    setMessages((prev) => [...prev, {
      id: Date.now(), senderId: user?.id, content: input, createdAt: new Date(),
    }]);
    setInput('');
  };

  return (
    <div className="flex flex-col h-screen max-h-screen">
      <header className="flex items-center gap-3 p-4 border-b border-border bg-card">
        <Link href="/messages" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft size={20} />
        </Link>
        {otherUser && (
          <>
            <Avatar className="h-9 w-9">
              <AvatarImage src={otherUser.avatar} />
              <AvatarFallback className="bg-primary/20 text-primary text-sm">
                {getInitials(otherUser.firstName, otherUser.lastName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm">{otherUser.firstName} {otherUser.lastName}</p>
              <p className="text-xs text-muted-foreground">@{otherUser.username}</p>
            </div>
          </>
        )}
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg: any) => {
          const isMe = msg.senderId === user?.id;
          return (
            <div key={msg.id} className={cn('flex', isMe ? 'justify-end' : 'justify-start')}>
              <div className={cn(
                'max-w-xs px-4 py-2 rounded-2xl text-sm',
                isMe ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-secondary text-foreground rounded-bl-sm',
              )}>
                {msg.content}
                <p className={cn('text-xs mt-1', isMe ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                  {timeAgo(msg.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 border-t border-border bg-card flex gap-2">
        <Input value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Votre message..." className="bg-secondary" />
        <Button onClick={sendMessage} disabled={!input.trim()} className="px-4">
          <Send size={18} />
        </Button>
      </div>
    </div>
  );
}
