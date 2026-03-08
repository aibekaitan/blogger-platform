import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('blogs')
@Index(['id'], { unique: true })
@Index(['name'], { unique: true })
export class Blog {
  @PrimaryGeneratedColumn('uuid')
  id: string; // UUID строки, аналог _id + id в Mongo

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

  // ================= STATIC CREATE =================
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
    // createdAt будет автоматически проставлен благодаря @CreateDateColumn
    return blog;
  }

  // ================= UPDATE METHODS =================
  // updateNameAndDescription(newName?: string, newDescription?: string): void {
  //   if (newName?.trim()) {
  //     this.name = newName.trim();
  //   }
  //   if (newDescription?.trim()) {
  //     this.description = newDescription.trim();
  //   }
  // }
}
