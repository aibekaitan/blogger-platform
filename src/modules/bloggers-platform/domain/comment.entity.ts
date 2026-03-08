import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('comments')
@Index(['id'], { unique: true })
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  postId: string;

  @Column({ type: 'text', nullable: false })
  content: string;

  @Column({ type: 'uuid', nullable: false })
  userId: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  userLogin: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  // ================= STATIC CREATE =================

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

  // ================= UPDATE =================

  updateContent(content: string) {
    if (content?.trim()) {
      this.content = content.trim();
    }
  }
}