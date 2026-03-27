package handler

import (
	"io/fs"
	"net/http"

	"github.com/gin-gonic/gin"
)

// Static serves embedded frontend files. Falls back to index.html
// for client-side routing (React Router).
func Static(files fs.FS) gin.HandlerFunc {
	fileServer := http.FileServer(http.FS(files))

	return func(c *gin.Context) {
		// Try to serve the requested file
		path := c.Request.URL.Path
		if _, err := fs.Stat(files, path[1:]); err == nil {
			fileServer.ServeHTTP(c.Writer, c.Request)
			c.Abort()
			return
		}

		// Fall back to index.html for client-side routing
		c.Request.URL.Path = "/"
		fileServer.ServeHTTP(c.Writer, c.Request)
		c.Abort()
	}
}
