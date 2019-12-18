const Blog = require('../models/blog')

const initialBlogs = [
  {
    title: 'Test title 1',
    author: 'Test author 1',
    url: 'www.fakeaddress1.com',
    likes: 42
  },
  {
    title: 'Test title 2',
    author: 'Test author 2',
    url: 'www.fakeaddress2.com',
    likes: 24
  }
]

const nonExistingId = async () => {
  const blog = new Blog({ content: 'willremovethissoon' })
  await blog.save()
  await blog.remove()

  return blog._id.toString()
}

const blogsInDb = async () => {
  const blogs = await Blog.find({})
  return blogs.map(blog => blog.toJSON())
}

module.exports = {
  initialBlogs, nonExistingId, blogsInDb
}