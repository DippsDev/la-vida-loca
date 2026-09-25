export default defineEventHandler(() => {
  throw createError({
    statusCode: 403,
    statusMessage: 'Admin sign-in uses the host accounts only.',
  })
})
