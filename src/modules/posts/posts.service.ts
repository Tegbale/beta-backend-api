import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';
import { CreatePostInput, ListQuery, CreateCommentInput } from './posts.schema';

const authorSelect = {
  id: true,
  firstName: true,
  lastName: true,
  role: true,
  avatar: true,
};

export const listPosts = async (schoolId: string, query: ListQuery) => {
  const { page, limit, search } = query;
  const skip = (page - 1) * limit;
  const where: any = { schoolId };
  if (search) where.content = { contains: search, mode: 'insensitive' };

  const [posts, total] = await prisma.$transaction([
    prisma.post.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: authorSelect },
        _count: { select: { comments: true } },
      },
    }),
    prisma.post.count({ where }),
  ]);

  return { posts, total };
};

export const getPost = async (schoolId: string, id: string) => {
  const post = await prisma.post.findFirst({
    where: { id, schoolId },
    include: {
      author: { select: authorSelect },
      _count: { select: { comments: true } },
    },
  });
  if (!post) throw new AppError('Post not found', 404);
  return post;
};

async function notifyMentions(content: string, schoolId: string, authorId: string, context: string) {
  const handles = [...new Set((content.match(/@([A-Za-z]+(?:\.[A-Za-z]+)?)/g) ?? []).map((h) => h.slice(1).toLowerCase()))];
  if (!handles.length) return;

  for (const handle of handles) {
    const [first, last] = handle.split('.');
    const where: any = {
      schoolId,
      id: { not: authorId },
      firstName: { equals: first, mode: 'insensitive' },
    };
    if (last) where.lastName = { equals: last, mode: 'insensitive' };

    const users = await prisma.user.findMany({ where, select: { id: true } });
    for (const u of users) {
      await prisma.notification.create({
        data: { userId: u.id, title: 'You were mentioned', body: context, type: 'mention' },
      });
    }
  }
}

export const createPost = async (schoolId: string, authorId: string, input: CreatePostInput) => {
  const post = await prisma.post.create({
    data: { ...input, schoolId, authorId },
    include: {
      author: { select: authorSelect },
      _count: { select: { comments: true } },
    },
  });
  notifyMentions(input.content, schoolId, authorId, `${post.author.firstName} mentioned you in a post`).catch(() => {});
  return post;
};

export const deletePost = async (schoolId: string, id: string, userId: string, role: string) => {
  const post = await getPost(schoolId, id);
  if (role !== 'SCHOOL_ADMIN' && post.authorId !== userId) {
    throw new AppError('Forbidden', 403);
  }
  await prisma.post.delete({ where: { id } });
};

export const listComments = async (postId: string, schoolId: string) => {
  const post = await prisma.post.findFirst({ where: { id: postId, schoolId } });
  if (!post) throw new AppError('Post not found', 404);

  return prisma.comment.findMany({
    where: { postId, parentCommentId: null },
    orderBy: { createdAt: 'asc' },
    include: {
      author: { select: authorSelect },
      replies: {
        orderBy: { createdAt: 'asc' },
        include: {
          author: { select: authorSelect },
          replies: {
            orderBy: { createdAt: 'asc' },
            include: { author: { select: authorSelect } },
          },
        },
      },
    },
  });
};

export const createComment = async (
  postId: string,
  schoolId: string,
  authorId: string,
  input: CreateCommentInput,
) => {
  const post = await prisma.post.findFirst({ where: { id: postId, schoolId } });
  if (!post) throw new AppError('Post not found', 404);

  if (input.parentCommentId) {
    const parent = await prisma.comment.findFirst({ where: { id: input.parentCommentId, postId } });
    if (!parent) throw new AppError('Parent comment not found', 404);
  }

  const comment = await prisma.comment.create({
    data: { ...input, postId, authorId },
    include: {
      author: { select: authorSelect },
      replies: { include: { author: { select: authorSelect } } },
    },
  });
  notifyMentions(input.content, post.schoolId, authorId, `${comment.author.firstName} mentioned you in a comment`).catch(() => {});
  return comment;
};

export const deleteComment = async (
  schoolId: string,
  commentId: string,
  userId: string,
  role: string,
) => {
  const comment = await prisma.comment.findFirst({
    where: { id: commentId },
    include: { post: true },
  });
  if (!comment || comment.post.schoolId !== schoolId) throw new AppError('Comment not found', 404);
  if (role !== 'SCHOOL_ADMIN' && comment.authorId !== userId) throw new AppError('Forbidden', 403);
  await prisma.comment.delete({ where: { id: commentId } });
};
