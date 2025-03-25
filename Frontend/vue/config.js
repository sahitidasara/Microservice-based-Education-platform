module.exports = {
    devServer: {
      host: 'localhost', // Force it to bind to localhost
      port: 8080,
      disableHostCheck: true, // Allow access from network IPs (optional)
      webSocketServer: 'ws' // Ensure WebSocket is enabled
    }
  };