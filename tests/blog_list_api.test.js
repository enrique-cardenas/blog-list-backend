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

test('all blogs are returned', async () => {
  const response = await api.get('/api/blogs')

  expect(response.body.length).toBe(helper.initialBlogs.length)
})

test('all blogs have their unique identifier property named id', async () => {
  const response = await api.get('/api/blogs')
  const blogs = response.body

  blogs.forEach(blog => expect(blog.id).toBeDefined())

})

test('a valid blog can be added', async () => {
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

test('likes property defaults to 0 if missing', async () => {
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

/*
test('return 400 Bad Request if author and url are missing from post request', async () => {
  const newBlog = {
    title: 'jest testing title 1',
    likes: 42
  }

  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(0)
}
*/

afterAll(() => {
  mongoose.connection.close()
})