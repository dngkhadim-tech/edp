import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReviewEntity } from '../../database/entities/review.entity';
import { CreateReviewDto, LoyaltyActionType, PaginationQuery } from '@edp/shared';
import { EstablishmentsService } from '../establishments/establishments.service';
import { LoyaltyService } from '../loyalty/loyalty.service';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(ReviewEntity)
    private readonly reviewRepo: Repository<ReviewEntity>,
    private readonly establishmentsService: EstablishmentsService,
    private readonly loyaltyService: LoyaltyService,
  ) {}

  async create(userId: string, dto: CreateReviewDto): Promise<ReviewEntity> {
    const existing = await this.reviewRepo.findOne({
      where: { userId, establishmentId: dto.establishmentId },
    });
    if (existing) throw new ConflictException('You already reviewed this establishment');

    const review = this.reviewRepo.create({ ...dto, userId });
    const saved = await this.reviewRepo.save(review);

    await this.establishmentsService.updateRating(dto.establishmentId);
    await this.loyaltyService.addPoints(userId, LoyaltyActionType.REVIEW, saved.id);

    return saved;
  }

  async getForEstablishment(establishmentId: string, query: PaginationQuery) {
    const { page = 1, limit = 20 } = query;
    const [data, total] = await this.reviewRepo.findAndCount({
      where: { establishmentId, isFlagged: false },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async respondToReview(
    reviewId: string,
    establishmentUserId: string,
    content: string,
  ): Promise<ReviewEntity> {
    const review = await this.reviewRepo.findOne({
      where: { id: reviewId },
      relations: ['establishment'],
    });
    if (!review) throw new NotFoundException('Review not found');
    if (review.establishment.userId !== establishmentUserId) throw new ForbiddenException();

    await this.reviewRepo.update(reviewId, {
      establishmentResponse: { content, respondedAt: new Date() },
    });
    return this.reviewRepo.findOne({ where: { id: reviewId } });
  }

  async markHelpful(reviewId: string, userId: string): Promise<void> {
    await this.reviewRepo.increment({ id: reviewId }, 'helpfulCount', 1);
  }

  async flagReview(reviewId: string): Promise<void> {
    await this.reviewRepo.update(reviewId, { isFlagged: true });
  }

  async delete(id: string, userId: string): Promise<void> {
    const review = await this.reviewRepo.findOne({ where: { id } });
    if (!review) throw new NotFoundException();
    if (review.userId !== userId) throw new ForbiddenException();
    await this.reviewRepo.delete(id);
    await this.establishmentsService.updateRating(review.establishmentId);
  }
}
