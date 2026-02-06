export const mapPostToView = (post: any) => ({
  id: post.id,
  title: post.title,
  shortDescription: post.shortDescription,
  content: post.content,
  blogId: post.blogId,
  blogName: post.blogName,
  createdAt: post.createdAt,

  extendedLikesInfo: {
    likesCount: 0,
    dislikesCount: 0,
    myStatus: 'None',
    newestLikes: [],
  },
});
