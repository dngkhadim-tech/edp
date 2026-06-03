import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { MessageEntity } from '../../database/entities/message.entity';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(MessageEntity)
    private readonly messageRepo: Repository<MessageEntity>,
  ) {}

  getConversationId(userA: string, userB: string): string {
    return [userA, userB].sort().join(':');
  }

  async sendMessage(senderId: string, receiverId: string, content: string, media?: any[]) {
    const conversationId = this.getConversationId(senderId, receiverId);
    const message = this.messageRepo.create({
      conversationId,
      senderId,
      receiverId,
      content,
      media,
    });
    return this.messageRepo.save(message);
  }

  async getConversation(userA: string, userB: string, page = 1, limit = 50) {
    const conversationId = this.getConversationId(userA, userB);
    const [data, total] = await this.messageRepo.findAndCount({
      where: { conversationId, isDeleted: false },
      relations: ['sender'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data: data.reverse(), meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getConversations(userId: string) {
    return this.messageRepo.query(
      `SELECT DISTINCT ON (conversation_id)
        m.*, u.username, u.avatar, u.first_name, u.last_name
       FROM messages m
       JOIN users u ON (
         CASE WHEN m.sender_id = $1 THEN u.id = m.receiver_id
              ELSE u.id = m.sender_id
         END
       )
       WHERE (m.sender_id = $1 OR m.receiver_id = $1) AND m.is_deleted = false
       ORDER BY conversation_id, m.created_at DESC`,
      [userId],
    );
  }

  async markAsRead(conversationId: string, userId: string): Promise<void> {
    await this.messageRepo.update(
      { conversationId, receiverId: userId },
      { isRead: true },
    );
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.messageRepo.count({
      where: { receiverId: userId, isRead: false, isDeleted: false },
    });
  }
}
