export const mapPostToView = (post: any) => {
  const likes = post.extendedLikesInfo || {
    likesCount: 0,
    dislikesCount: 0,
    newestLikes: [],
  };

  return {
    id: post.id,
    title: post.title,
    shortDescription: post.shortDescription,
    content: post.content,
    blogId: post.blogId,
    blogName: post.blogName,
    createdAt: post.createdAt,
    extendedLikesInfo: {
      likesCount: likes.likesCount ?? 0,
      dislikesCount: likes.dislikesCount ?? 0,
      myStatus: post.myStatus ?? likes.myStatus ?? 'None',
      newestLikes: likes.newestLikes ?? [],
    },
  };
};