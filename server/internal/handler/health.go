package handler

import (
	"github.com/gin-gonic/gin"
)

// Health returns a handler that reports server health status.
func Health() gin.HandlerFunc {
	return func(c *gin.Context) {
		Success(c, gin.H{"status": "ok"})
	}
}

// Message returns a handler with a test greeting.
func Message() gin.HandlerFunc {
	return func(c *gin.Context) {
		Success(c, gin.H{"message": "Hello from Gin backend!"})
	}
}
