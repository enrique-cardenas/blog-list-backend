const mongoose = require('mongoose')
const supertest = require('supertest')
const helper = require('./test_helper')
const app = require('../app')
const api = supertest(app)

const Blog = require('../models/blog')

beforeEach(async () => {
  await Blog.deleteMany({})

  const blogObjects = helper.initialBlogs
    .map(blog => new Blog(blog))
  const promiseArray = blogObjects.map(blog => blog.save())
  await Promise.all(promiseArray)
})

describe('when there is initially some blogs saved', () => {
  test('all blogs are returned', async () => {
    const response = await api.get('/api/blogs')

    expect(response.body.length).toBe(helper.initialBlogs.length)
  })

  test('all blogs have their unique identifier property named id', async () => {
    const response = await api.get('/api/blogs')
    const blogs = response.body

    blogs.forEach(blog => expect(blog.id).toBeDefined())
  })

  describe('addition of a new blog', () => {
    test('succeeds with valid data', async () => {
      const newBlog = {
        title: 'jest testing title 1',
        author: 'jest test author 1',
        url: 'www.jestfakeaddress1.com',
        likes: 11
      }

      await api
        .post('/api/blogs')
        .send(newBlog)
        .expect(200)
        .expect('Content-Type', /application\/json/)

      const blogsAtEnd = await helper.blogsInDb()
      expect(blogsAtEnd.length).toBe(helper.initialBlogs.length + 1)

      const titles = blogsAtEnd.map(blog => blog.title)
      expect(titles).toContain(
        'jest testing title 1'
      )
    })

    test('defaults likes to 0 if missing', async () => {
      const newBlog = {
        title: 'jest testing title 1',
        author: 'jest test author 1',
        url: 'www.jestfakeaddress1.com'
      }

      await api
        .post('/api/blogs')
        .send(newBlog)

      const response = await api.get('/api/blogs')
      const blogs = response.body

      const lastBlogAdded = blogs[blogs.length - 1]
      expect(lastBlogAdded.likes).toBeDefined()
      expect(lastBlogAdded.likes).toBe(0)
    })

    test('returns 400 Bad Request if author and url are missing from post request', async () => {
      const newBlog = {
        title: 'jest testing title 1',
        likes: 42
      }

      await api
        .post('/api/blogs')
        .send(newBlog)
        .expect(400)
    })
  })

  describe('deletion of a blog', () => {
    test('succeeds with status code 204 if id is valid', async () => {
      const blogsBeforeDeletion = await helper.blogsInDb()
      const blogToDelete = blogsBeforeDeletion[0]

      await api
        .delete(`/api/blogs/${blogToDelete.id}`)
        .expect(204)

      const blogsAfterDeletion = await helper.blogsInDb()
      expect(blogsAfterDeletion.length).toBe(
        helper.initialBlogs.length - 1
      )

      const titles = blogsAfterDeletion.map(blog => blog.title)

      expect(titles).not.toContain(blogToDelete.title)
    })
  })
})

afterAll(() => {
  mongoose.connection.close()
})