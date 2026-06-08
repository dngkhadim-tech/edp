import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostLikeEntity } from '../../database/entities/post-like.entity';
import { PostSaveEntity } from '../../database/entities/post-save.entity';
import { CommentEntity } from '../../database/entities/comment.entity';
import { PostEntity } from '../../database/entities/post.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../../database/entities/notification.entity';

@Injectable()
export class InteractionsService {
  constructor(
    @InjectRepository(PostLikeEntity)
    private readonly likeRepo: Repository<PostLikeEntity>,
    @InjectRepository(PostSaveEntity)
    private readonly saveRepo: Repository<PostSaveEntity>,
    @InjectRepository(CommentEntity)
    private readonly commentRepo: Repository<CommentEntity>,
    @InjectRepository(PostEntity)
    private readonly postRepo: Repository<PostEntity>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async toggleLike(userId: string, postId: string): Promise<{ liked: boolean; count: number }> {
    const existing = await this.likeRepo.findOne({ where: { userId, postId } });
    if (existing) {
      await this.likeRepo.delete({ userId, postId });
      await this.postRepo.decrement({ id: postId }, 'likesCount', 1);
      const post = await this.postRepo.findOne({ where: { id: postId } });
      return { liked: false, count: post.likesCount };
    } else {
      await this.likeRepo.save(this.likeRepo.create({ userId, postId }));
      await this.postRepo.increment({ id: postId }, 'likesCount', 1);
      const post = await this.postRepo.findOne({ where: { id: postId } });
      if (post && post.authorId !== userId) {
        this.notificationsService.create({
          userId: post.authorId,
          actorId: userId,
          type: NotificationType.LIKE,
          message: 'a aimé votre publication',
          referenceId: postId,
          referenceType: 'post',
        }).catch(() => {});
      }
      return { liked: true, count: post.likesCount };
    }
  }

  async toggleSave(userId: string, postId: string): Promise<{ saved: boolean; count: number }> {
    const existing = await this.saveRepo.findOne({ where: { userId, postId } });
    if (existing) {
      await this.saveRepo.delete({ userId, postId });
      await this.postRepo.decrement({ id: postId }, 'savesCount', 1);
      const post = await this.postRepo.findOne({ where: { id: postId } });
      return { saved: false, count: post.savesCount };
    } else {
      await this.saveRepo.save(this.saveRepo.create({ userId, postId }));
      await this.postRepo.increment({ id: postId }, 'savesCount', 1);
      const post = await this.postRepo.findOne({ where: { id: postId } });
      return { saved: true, count: post.savesCount };
    }
  }

  async getPostLikes(postId: string, userId: string) {
    const [likes, total] = await this.likeRepo.findAndCount({
      where: { postId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: 20,
    });
    const isLiked = userId
      ? !!(await this.likeRepo.findOne({ where: { postId, userId } }))
      : false;
    return { likes: likes.map((l) => l.user), total, isLiked };
  }

  async getSavedPosts(userId: string, page = 1, limit = 20) {
    const [saves, total] = await this.saveRepo.findAndCount({
      where: { userId },
      relations: ['post'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return {
      data: saves.map((s) => s.post),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async addComment(userId: string, postId: string, content: string, parentId?: string): Promise<CommentEntity> {
    const comment = this.commentRepo.create({ postId, authorId: userId, content, parentId } as any);
    const saved = await this.commentRepo.save(comment) as unknown as CommentEntity;
    await this.postRepo.increment({ id: postId }, 'commentsCount', 1);
    const post = await this.postRepo.findOne({ where: { id: postId } });
    if (post && post.authorId !== userId) {
      this.notificationsService.create({
        userId: post.authorId,
        actorId: userId,
        type: NotificationType.COMMENT,
        message: 'a commenté votre publication',
        referenceId: postId,
        referenceType: 'post',
      }).catch(() => {});
    }
    return this.commentRepo.findOne({ where: { id: saved.id }, relations: ['author'] });
  }

  async getComments(postId: string, page = 1, limit = 20) {
    const [data, total] = await this.commentRepo.findAndCount({
      where: { postId, parentId: null },
      relations: ['author'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async deleteComment(id: string, userId: string): Promise<void> {
    const comment = await this.commentRepo.findOne({ where: { id } });
    if (!comment) throw new NotFoundException();
    if (comment.authorId !== userId) throw new NotFoundException();
    await this.commentRepo.delete(id);
    await this.postRepo.decrement({ id: comment.postId }, 'commentsCount', 1);
  }

  async likeComment(commentId: string): Promise<void> {
    await this.commentRepo.increment({ id: commentId }, 'likesCount', 1);
  }
}
