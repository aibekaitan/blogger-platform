export const mapPostToView = (post: any) => ({
  id: post.id,
  title: post.title,
  shortDescription: post.shortDescription,
  content: post.content,
  blogId: post.blogId,
  blogName: post.blogName,
  createdAt: post.createdAt,

  extendedLikesInfo: {
    ...post.extendedLikesInfo, // ← keep everything that exists
    myStatus: post.myStatus ?? 'None', // ← only override/add this one
    // newestLikes already comes sorted from DB or from findById — no need to touch
  },
});
