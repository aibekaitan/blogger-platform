// src/bloggers-platform/blogs/types/blog.view.ts

import { Blog } from '../../domain/blog.entity';

export class BlogViewModel {
  id: string;
  name: string;
  description: string;
  websiteUrl: string;
  createdAt: string;
  isMembership: boolean;

  static mapToView(blog: Blog): BlogViewModel {
    const dto = new BlogViewModel();

    dto.id = blog.id;
    dto.name = blog.name;
    dto.description = blog.description;
    dto.websiteUrl = blog.websiteUrl;
    dto.createdAt = blog.createdAt;
    dto.isMembership = blog.isMembership;

    return dto;
  }

  static mapMany(blogs: Blog[]): BlogViewModel[] {
    return blogs.map(this.mapToView);
  }
}
