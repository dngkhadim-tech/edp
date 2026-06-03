import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { UserEntity } from '../../database/entities/user.entity';
import { EstablishmentEntity } from '../../database/entities/establishment.entity';
import { PostEntity } from '../../database/entities/post.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, EstablishmentEntity, PostEntity])],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
