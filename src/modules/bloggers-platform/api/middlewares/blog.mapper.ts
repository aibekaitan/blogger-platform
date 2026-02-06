export const mapBlogToView = (blog: any) => ({
  id: blog.id,
  name: blog.name,
  description: blog.description,
  websiteUrl: blog.websiteUrl,
  createdAt: blog.createdAt,
  isMembership: blog.isMembership,
});
