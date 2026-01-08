const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const hostname = '0.0.0.0' // Listen on all network interfaces
const port = parseInt(process.env.PORT || '10000', 10)

console.log('🚀 Initializing Next.js server...')
console.log(`📍 Environment: ${process.env.NODE_ENV}`)
console.log(`🔌 Port: ${port}`)
console.log(`🌐 Hostname: ${hostname}`)

// Initialize Next.js
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare()
  .then(() => {
    console.log('✅ Next.js prepared successfully')
    
    const server = createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true)
        await handle(req, res, parsedUrl)
      } catch (err) {
        console.error('❌ Error occurred handling', req.url, err)
        res.statusCode = 500
        res.end('Internal server error')
      }
    })

    server.once('error', (err) => {
      console.error('❌ Server error:', err)
      process.exit(1)
    })

    server.listen(port, hostname, () => {
      console.log(`✅ Server ready on http://${hostname}:${port}`)
      console.log(`🌍 Access your app at http://localhost:${port}`)
    })
  })
  .catch((err) => {
    console.error('❌ Failed to prepare Next.js:', err)
    process.exit(1)
  })
