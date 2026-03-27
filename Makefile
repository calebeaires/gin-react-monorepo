.PHONY: dev dev-server dev-web install build clean

# Run server and web in parallel (development)
dev:
	@echo "Starting server and web..."
	$(MAKE) dev-server & $(MAKE) dev-web & wait

dev-server:
	cd server && go run ./cmd/server

dev-web:
	cd web && npm run dev

install:
	cd server && go mod download
	cd web && npm install

# Build single binary with embedded frontend
build:
	cd web && npm run build
	rm -rf server/cmd/server/static && mkdir -p server/cmd/server/static
	cp -r web/dist/* server/cmd/server/static/
	cd server && go build -o ../dist/server ./cmd/server
	@echo ""
	@echo "Built: dist/server (single binary with embedded frontend)"
	@echo "Run:   ./dist/server"

clean:
	rm -rf dist server/cmd/server/static
	mkdir -p server/cmd/server/static
	touch server/cmd/server/static/.gitkeep
