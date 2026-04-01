import { Blog } from './blog.entity';
import { Comment } from './comment.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';

interface NewestLike {
  addedAt: string;
  userId: string;
  login: string;
}

@Entity('posts')
@Index(['id'], { unique: true })
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  title: string;

  @Column({ type: 'varchar', length: 500, nullable: false })
  shortDescription: string;

  @Column({ type: 'text', nullable: false })
  content: string;

  @ManyToOne(() => Blog, (blog) => blog.posts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'blogId' })
  blog: Blog;

  @Column({ type: 'uuid', nullable: false })
  blogId: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  blogName: string;

  @OneToMany(() => Comment, (comment) => comment.post)
  comments: Comment[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @Column({
    type: 'jsonb',
    nullable: false,
    default: () => `'{"likesCount":0,"dislikesCount":0,"newestLikes":[]}'`,
  })
  extendedLikesInfo: {
    likesCount: number;
    dislikesCount: number;
    newestLikes: NewestLike[];
  };

  // ================= STATIC CREATE =================
  static create(dto: {
    title: string;
    shortDescription: string;
    content: string;
    blogId: string;
    blogName: string;
  }): Post {
    const post = new Post();
    post.title = dto.title.trim();
    post.shortDescription = dto.shortDescription.trim();
    post.content = dto.content;
    post.blogId = dto.blogId;
    post.blogName = dto.blogName;
    post.extendedLikesInfo = {
      likesCount: 0,
      dislikesCount: 0,
      newestLikes: [],
    };

    return post;
  }

  updateContent(
    title?: string,
    shortDescription?: string,
    content?: string,
  ): void {
    if (title?.trim()) this.title = title.trim();
    if (shortDescription?.trim())
      this.shortDescription = shortDescription.trim();
    if (content?.trim()) this.content = content;
  }

  updateLikesInfo(
    likesCount: number,
    dislikesCount: number,
    newestLikes: NewestLike[],
  ) {
    this.extendedLikesInfo = { likesCount, dislikesCount, newestLikes };
  }
}
