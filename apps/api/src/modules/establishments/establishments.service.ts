import {
  Injectable, NotFoundException, ForbiddenException, ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between } from 'typeorm';
import slugify from 'slugify';
import { EstablishmentEntity } from '../../database/entities/establishment.entity';
import { FollowEntity } from '../../database/entities/follow.entity';
import { SearchQuery } from '@edp/shared';
import { CreateEstablishmentDto } from './dto/create-establishment.dto';
import { UpdateEstablishmentDto } from './dto/update-establishment.dto';

@Injectable()
export class EstablishmentsService {
  constructor(
    @InjectRepository(EstablishmentEntity)
    private readonly estRepo: Repository<EstablishmentEntity>,
    @InjectRepository(FollowEntity)
    private readonly followRepo: Repository<FollowEntity>,
  ) {}

  async create(userId: string, dto: CreateEstablishmentDto): Promise<EstablishmentEntity> {
    const slug = await this.generateSlug(dto.name);
    const est = this.estRepo.create({ ...dto, userId, slug });
    return this.estRepo.save(est) as unknown as Promise<EstablishmentEntity>;
  }

  async findById(id: string, currentUserId?: string) {
    const est = await this.estRepo.findOne({ where: { id } });
    if (!est) throw new NotFoundException('Establishment not found');

    let isFollowing = false;
    if (currentUserId) {
      const follow = await this.followRepo.findOne({
        where: { followerId: currentUserId, followingId: id, followingType: 'ESTABLISHMENT' },
      });
      isFollowing = !!follow;
    }

    return { ...est, isFollowing };
  }

  async findBySlug(slug: string, currentUserId?: string) {
    const est = await this.estRepo.findOne({ where: { slug } });
    if (!est) throw new NotFoundException('Establishment not found');
    return this.findById(est.id, currentUserId);
  }

  async findByOwner(userId: string): Promise<EstablishmentEntity | null> {
    return this.estRepo.findOne({ where: { userId } });
  }

  async update(id: string, userId: string, dto: UpdateEstablishmentDto): Promise<EstablishmentEntity> {
    const est = await this.findById(id);
    if (est.userId !== userId) throw new ForbiddenException();
    await this.estRepo.update(id, dto);
    return this.estRepo.findOne({ where: { id } });
  }

  async search(query: SearchQuery) {
    const { page = 1, limit = 20, q, type, city, country, minRating } = query;

    const qb = this.estRepo.createQueryBuilder('e')
      .where('e.is_active = true');

    if (q) {
      qb.andWhere('(e.name ILIKE :q OR e.description ILIKE :q OR e.city ILIKE :q)', {
        q: `%${q}%`,
      });
    }
    if (type) qb.andWhere('e.type = :type', { type });
    if (city) qb.andWhere('e.city ILIKE :city', { city: `%${city}%` });
    if (country) qb.andWhere('e.country = :country', { country });
    if (minRating) qb.andWhere('e.average_rating >= :minRating', { minRating });

    if (query.latitude && query.longitude && query.radius) {
      qb.andWhere(
        `earth_distance(ll_to_earth(e.latitude, e.longitude), ll_to_earth(:lat, :lng)) <= :radius`,
        { lat: query.latitude, lng: query.longitude, radius: (query.radius || 10) * 1000 },
      );
    }

    const [data, total] = await qb
      .orderBy('e.average_rating', 'DESC')
      .addOrderBy('e.reviews_count', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getNearby(latitude: number, longitude: number, radius = 10, type?: string) {
    const qb = this.estRepo.createQueryBuilder('e')
      .where('e.is_active = true')
      .andWhere(
        `earth_distance(ll_to_earth(e.latitude, e.longitude), ll_to_earth(:lat, :lng)) <= :radius`,
        { lat: latitude, lng: longitude, radius: radius * 1000 },
      );
    if (type) qb.andWhere('e.type = :type', { type });
    return qb.orderBy('e.average_rating', 'DESC').limit(50).getMany();
  }

  async getFeatured(type?: string) {
    const qb = this.estRepo.createQueryBuilder('e')
      .where('e.is_active = true AND e.is_premium = true');
    if (type) qb.andWhere('e.type = :type', { type });
    return qb.orderBy('e.average_rating', 'DESC').limit(20).getMany();
  }

  async updateRating(id: string): Promise<void> {
    await this.estRepo.query(
      `UPDATE establishments SET
        average_rating = (SELECT AVG(rating) FROM reviews WHERE establishment_id = $1),
        reviews_count = (SELECT COUNT(*) FROM reviews WHERE establishment_id = $1)
       WHERE id = $1`,
      [id],
    );
  }

  private async generateSlug(name: string): Promise<string> {
    let slug = slugify(name, { lower: true, strict: true });
    let counter = 1;
    while (await this.estRepo.findOne({ where: { slug } })) {
      slug = `${slugify(name, { lower: true, strict: true })}-${counter++}`;
    }
    return slug;
  }
}
