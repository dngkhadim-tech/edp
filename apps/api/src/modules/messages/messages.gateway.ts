import {
  WebSocketGateway, WebSocketServer, SubscribeMessage,
  MessageBody, ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MessagesService } from './messages.service';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/messages',
})
export class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<string, string>();

  constructor(
    private readonly messagesService: MessagesService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(socket: Socket) {
    try {
      const token = socket.handshake.auth.token;
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_SECRET'),
      });
      this.connectedUsers.set(payload.sub, socket.id);
      socket.data.userId = payload.sub;
      socket.join(`user:${payload.sub}`);
    } catch {
      socket.disconnect();
    }
  }

  handleDisconnect(socket: Socket) {
    if (socket.data.userId) {
      this.connectedUsers.delete(socket.data.userId);
    }
  }

  @SubscribeMessage('send_message')
  async handleMessage(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { receiverId: string; content: string; media?: { url: string; type: string }[] },
  ) {
    const senderId = socket.data.userId;
    const message = await this.messagesService.sendMessage(
      senderId,
      data.receiverId,
      data.content,
      data.media,
    );

    this.server.to(`user:${data.receiverId}`).emit('new_message', message);
    return message;
  }

  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    await this.messagesService.markAsRead(data.conversationId, socket.data.userId);
    this.server.to(`user:${socket.data.userId}`).emit('messages_read', data);
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { receiverId: string; isTyping: boolean },
  ) {
    this.server.to(`user:${data.receiverId}`).emit('user_typing', {
      userId: socket.data.userId,
      isTyping: data.isTyping,
    });
  }
}
