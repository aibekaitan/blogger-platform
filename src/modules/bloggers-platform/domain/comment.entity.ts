import { Post } from './post.entity';
import { User } from '../../user-accounts/domain/user.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('comments')
@Index(['id'], { unique: true })
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Post, (post) => post.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post: Post;

  @Column({ type: 'uuid', nullable: false })
  postId: string;

  @Column({ type: 'text', nullable: false })
  content: string;

  @ManyToOne(() => User, (user) => user.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid', nullable: false })
  userId: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  userLogin: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  static create(dto: {
    postId: string;
    content: string;
    userId: string;
    userLogin: string;
  }): Comment {
    const comment = new Comment();

    comment.postId = dto.postId;
    comment.content = dto.content.trim();
    comment.userId = dto.userId;
    comment.userLogin = dto.userLogin;

    return comment;
  }

  updateContent(content: string) {
    if (content?.trim()) {
      this.content = content.trim();
    }
  }
}
