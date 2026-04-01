import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { randomUUID } from 'crypto';

describe('Comments (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let postId: string;
  let blogId: string;
  let commentId: string;

  const basicAuth = Buffer.from('admin:qwerty').toString('base64');

  jest.setTimeout(30000);

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    // Очищаем базу перед началом тестов
    await request(app.getHttpServer()).delete('/testing/all-data').expect(204);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should register and login user', async () => {
    const login = `u${randomUUID().slice(0, 6)}`; // 1 + 6 = 7 chars, OK
    const email = `${login}@test.com`;
    const password = 'password123';

    // 1. Registration (assuming it's confirmed automatically or we don't need confirmation for this test)
    // Note: In real app we might need to mock email service or use a specific test method to confirm user
    // For simplicity, let's assume we can login or we use a pre-confirmed user if possible.
    // If registration needs confirmation, this might fail. 
    // Let's try to create a user directly if there is a SA route or just register.
    
    await request(app.getHttpServer())
      .post('/auth/registration')
      .send({ login, password, email })
      .expect(204);

    // Manual confirmation if needed - we'd need the code from DB.
    // But let's see if login works (maybe isConfirmed is true by default in dev/test)

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ loginOrEmail: login, password })
      .expect(200);

    accessToken = loginRes.body.accessToken;
    expect(accessToken).toBeDefined();
  });

  it('should create blog and post', async () => {
    // 2. Create Blog
    const blogRes = await request(app.getHttpServer())
      .post('/blogs')
      .set('Authorization', `Basic ${basicAuth}`)
      .send({
        name: 'Test Blog',
        description: 'Description',
        websiteUrl: 'https://test.com'
      })
      .expect(201);

    blogId = blogRes.body.id;

    // 3. Create Post
    const postRes = await request(app.getHttpServer())
      .post(`/blogs/${blogId}/posts`)
      .set('Authorization', `Basic ${basicAuth}`)
      .send({
        title: 'Test Post',
        shortDescription: 'Short',
        content: 'Long content'
      })
      .expect(201);

    postId = postRes.body.id;
  });

  it('should create comment for post', async () => {
    const commentContent = 'This is a very interesting comment for testing TypeORM.';
    
    const res = await request(app.getHttpServer())
      .post(`/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ content: commentContent })
      .expect(201);

    commentId = res.body.id;
    expect(res.body.content).toBe(commentContent);
    expect(res.body.commentatorInfo.userId).toBeDefined();
    expect(res.body.commentatorInfo.userLogin).toBeDefined();
  });

  it('should get comment by id', async () => {
    const res = await request(app.getHttpServer())
      .get(`/comments/${commentId}`)
      .expect(200);

    expect(res.body.id).toBe(commentId);
    expect(res.body.likesInfo.likesCount).toBe(0);
    expect(res.body.likesInfo.myStatus).toBe('None');
  });

  it('should update comment', async () => {
    const newContent = 'Updated comment content must be at least 20 symbols long.';
    
    await request(app.getHttpServer())
      .put(`/comments/${commentId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ content: newContent })
      .expect(204);

    const res = await request(app.getHttpServer())
      .get(`/comments/${commentId}`)
      .expect(200);

    expect(res.body.content).toBe(newContent);
  });

  it('should set like status for comment', async () => {
    await request(app.getHttpServer())
      .put(`/comments/${commentId}/like-status`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ likeStatus: 'Like' })
      .expect(204);

    const res = await request(app.getHttpServer())
      .get(`/comments/${commentId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.likesInfo.likesCount).toBe(1);
    expect(res.body.likesInfo.myStatus).toBe('Like');
  });

  it('should delete comment', async () => {
    await request(app.getHttpServer())
      .delete(`/comments/${commentId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(204);

    await request(app.getHttpServer())
      .get(`/comments/${commentId}`)
      .expect(404);
  });
});
