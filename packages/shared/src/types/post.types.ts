export enum PostType {
  PHOTO = 'PHOTO',
  VIDEO = 'VIDEO',
  REEL = 'REEL',
  STORY = 'STORY',
  REVIEW = 'REVIEW',
  PROMOTION = 'PROMOTION',
}

export interface MediaItem {
  url: string;
  type: 'image' | 'video';
  thumbnail?: string;
  width?: number;
  height?: number;
  duration?: number;
}

export interface Post {
  id: string;
  authorId: string;
  authorType: 'USER' | 'ESTABLISHMENT';
  establishmentId?: string;
  type: PostType;
  caption?: string;
  media: MediaItem[];
  hashtags: string[];
  location?: string;
  latitude?: number;
  longitude?: number;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  savesCount: number;
  viewsCount: number;
  isLiked?: boolean;
  isSaved?: boolean;
  expiresAt?: Date; // for stories
  createdAt: Date;
  updatedAt: Date;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorType: 'USER' | 'ESTABLISHMENT';
  parentId?: string;
  content: string;
  likesCount: number;
  isLiked?: boolean;
  replies?: Comment[];
  createdAt: Date;
}
