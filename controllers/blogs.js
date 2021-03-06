const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const User = require('../models/user')
const jwt = require('jsonwebtoken')

blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog
    .find({}).populate('user', { username: 1, name: 1 })
  response.json(blogs.map(blog => blog.toJSON()))
})

blogsRouter.get('/:id', (request,response, next) => {
  Blog.findById(request.params.id)
    .then(blog => {
      if(blog) response.json(blog.toJSON())
      else response.status(404).end()
    })
    .catch(error => next(error))
})

blogsRouter.post('/', async (request, response, next) => {
  const body = request.body

  if(!body.title && !body.url) response.status(404).end()

  try {
    const decodedToken = jwt.verify(request.token, process.env.SECRET)
    if (!request.token || !decodedToken.id) {
      return response.status(401).json({ error: 'token missing or invalid' })
    }

    const user = await User.findById(decodedToken.id)

    const blog = new Blog({
      title: body.title,
      author: body.author,
      url: body.url,
      likes: body.likes || 0,
      user: user._id
    })

    const savedBlog = await blog.save()

    const populatedBlog = await Blog.findById(savedBlog._id).populate('user', { username: 1, name: 1 })

    user.blogs = user.blogs.concat(savedBlog._id)
    await user.save()

    response.json(populatedBlog.toJSON())
  } catch(exception) {
    next(exception)
  }
})

blogsRouter.post('/:id/comments', async (request, response, next) => {
  const commentObject = {
    comment: request.body.comment,
  }

  try {
    const updatedBlog = await Blog
      .findByIdAndUpdate(
        request.params.id,
        { $push: { comments : commentObject } },
        { new: true })
      .populate('user', { username: 1, name: 1 })
    response.json(updatedBlog.toJSON())
  } catch(exception){
    next(exception)
  }

})

blogsRouter.put('/:id', async (request, response, next) => {
  const body = request.body

  const blog = {
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes
  }

  try{
    const updatedBlog = await Blog.findByIdAndUpdate(request.params.id, blog, { new: true })
      .populate('user', { username: 1, name: 1 })
    response.json(updatedBlog.toJSON())
  }
  catch(exception) {
    next(exception)
  }
})

blogsRouter.delete('/:id', async (request, response, next) => {
  try {
    const decodedToken = jwt.verify(request.token, process.env.SECRET)
    if (!request.token || !decodedToken.id) {
      return response.status(401).json({ error: 'token missing or invalid' })
    }

    const user = await User.findById(decodedToken.id)
    const blog = await Blog.findById(request.params.id)

    if(user.id.toString() === blog.user.toString()){
      user.blogs =  user.blogs.filter(cur => !cur.equals(blog.id))
      await user.save()
      await Blog.findByIdAndRemove(request.params.id)
      response.status(204).end()
    }
    else{
      return response.status(401).json({ error: 'token missing or invalid' })
    }
  }
  catch(exception) {
    next(exception)
  }
})

module.exports = blogsRouter