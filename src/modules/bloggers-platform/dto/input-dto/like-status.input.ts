// dto/like-status.input.ts
import { IsEnum, IsNotEmpty } from 'class-validator';

export enum LikeStatus {
  Like = 'Like',
  Dislike = 'Dislike',
  None = 'None',
}

export class LikeStatusInputModel {
  @IsNotEmpty()
  @IsEnum(LikeStatus)
  likeStatus: LikeStatus;
}
