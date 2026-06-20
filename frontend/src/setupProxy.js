const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  // Proxy REST API calls
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:8084',
      changeOrigin: true,
    })
  );

  // Proxy WebSocket connections
  app.use(
    '/ws',
    createProxyMiddleware({
      target: 'http://localhost:8084',
      changeOrigin: true,
      ws: true,
    })
  );
};
