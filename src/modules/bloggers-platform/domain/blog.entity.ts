import { Post } from './post.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';

@Entity('blogs')
@Index(['id'], { unique: true })
// @Index(['name'], { unique: true })
export class Blog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  name: string;

  @Column({ type: 'varchar', length: 1000, nullable: false })
  description: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  websiteUrl: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @Column({ type: 'boolean', default: false })
  isMembership: boolean;

  @OneToMany(() => Post, (post) => post.blog)
  posts: Post[];

  static create(dto: {
    name: string;
    description: string;
    websiteUrl: string;
  }): Blog {
    const blog = new Blog();
    blog.name = dto.name.trim();
    blog.description = dto.description.trim();
    blog.websiteUrl = dto.websiteUrl;
    blog.isMembership = false;
    return blog;
  }

  // updateNameAndDescription(newName?: string, newDescription?: string): void {
  //   if (newName?.trim()) {
  //     this.name = newName.trim();
  //   }
  //   if (newDescription?.trim()) {
  //     this.description = newDescription.trim();
  //   }
  // }
}
