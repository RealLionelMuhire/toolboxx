const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const hostname = '0.0.0.0' // Listen on all network interfaces
const port = parseInt(process.env.PORT || '3000', 10) // Railway/DO inject PORT; fallback to 3000

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
      // Keep-alive: reduce TCP connection churn (Railway LB timeout is ~60s)
      res.setHeader('Connection', 'keep-alive')
      res.setHeader('Keep-Alive', 'timeout=5')
      try {
        const parsedUrl = parse(req.url, true)
        await handle(req, res, parsedUrl)
      } catch (err) {
        console.error('❌ Error occurred handling', req.url, err)
        res.statusCode = 500
        res.end('Internal server error')
      }
    })

    // Must be > the load balancer's idle timeout (Railway/DO: ~60s) to avoid 502s
    server.keepAliveTimeout = 70000
    server.headersTimeout = 75000

    server.once('error', (err) => {
      console.error('❌ Server error:', err.code, err.message)
      // Only exit on port conflicts at startup — other errors are non-fatal
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${port} is already in use. Exiting.`)
        process.exit(1)
      }
      console.warn('⚠️  Non-fatal server error — continuing...')
    })

    server.listen(port, hostname, () => {
      console.log(`✅ Server ready on http://${hostname}:${port}`)
      console.log(`🌍 Access your app at http://localhost:${port}`)

      // Log heap usage every 60s so you can spot memory leaks in DO/Railway logs
      setInterval(() => {
        const mem = process.memoryUsage()
        const rss  = Math.round(mem.rss        / 1024 / 1024)
        const used = Math.round(mem.heapUsed   / 1024 / 1024)
        const total= Math.round(mem.heapTotal  / 1024 / 1024)
        console.log(`[Memory] RSS: ${rss}MB | Heap: ${used}/${total}MB`)
      }, 60_000)
    })

    // ── Graceful shutdown ─────────────────────────────────────────────────────
    // DigitalOcean and Railway send SIGTERM before killing a container.
    // Without this, in-flight requests are dropped mid-response.
    const shutdown = (signal) => {
      console.log(`🛑 ${signal} received — graceful shutdown...`)
      server.close(() => {
        console.log('✅ HTTP server closed cleanly')
        process.exit(0)
      })
      // Force-exit if connections don't drain within 10s
      setTimeout(() => {
        console.error('⏰ Forced exit after 10s timeout')
        process.exit(1)
      }, 10_000).unref()
    }

    process.on('SIGTERM', () => shutdown('SIGTERM'))
    process.on('SIGINT',  () => shutdown('SIGINT'))
  })
  .catch((err) => {
    console.error('❌ Failed to prepare Next.js:', err)
    process.exit(1)
  })
