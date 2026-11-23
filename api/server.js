const http = require('node:http')

const PORT = Number(process.env.PORT || 3000)

function sendJson(response, status, data) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  })
  response.end(data === undefined ? '' : JSON.stringify(data))
}

const server = http.createServer((request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`)

  if (request.method === 'OPTIONS') {
    return sendJson(response, 204)
  }

  if (request.method === 'GET' && url.pathname === '/api/health') {
    return sendJson(response, 200, { status: 'ok' })
  }

  return sendJson(response, 404, { message: 'Route inconnue.' })
})

server.listen(PORT, () => {
  console.log(`API template prête sur http://localhost:${PORT}`)
})
