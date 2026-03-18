import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';

export enum LikeStatus {
  None = 'None',
  Like = 'Like',
  Dislike = 'Dislike',
}

@Entity('likes')
@Index(['authorId', 'parentId', 'parentType'], { unique: true })
export class Like {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({
    type: 'enum',
    enum: LikeStatus,
  })
  status: LikeStatus;

  @Column({ type: 'uuid' })
  authorId: string;

  @Column({ type: 'uuid' })
  parentId: string;

  @Column({ type: 'varchar', default: 'Comment' })
  parentType: string;

  static create(dto: {
    authorId: string;
    parentId: string;
    status: LikeStatus;
    parentType?: string;
  }): Like {
    const like = new Like();

    like.authorId = dto.authorId;
    like.parentId = dto.parentId;
    like.status = dto.status;
    like.parentType = dto.parentType || 'Comment';

    return like;
  }
}
