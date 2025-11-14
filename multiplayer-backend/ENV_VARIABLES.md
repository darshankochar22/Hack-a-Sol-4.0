# 🔧 Environment Variables Guide

## Is `.env` Required?

**No, `.env` is optional!** All environment variables have sensible defaults.

However, creating a `.env` file is **recommended** if you want to:

- Change the port (if 5003 is in use)
- Configure CORS for production
- Customize server settings

## Available Variables

### `PORT` (Optional)

- **Default:** `5003`
- **Description:** Port the server listens on
- **When to change:** If port 5003 is already in use
- **Example:**
  ```env
  PORT=5004
  ```

### `HOST` (Optional)

- **Default:** `0.0.0.0` (all network interfaces)
- **Description:** Network interface to bind to
- **Options:**
  - `0.0.0.0` - Accessible from all network interfaces (recommended for multiplayer)
  - `127.0.0.1` - Only accessible from localhost
  - `192.168.1.100` - Specific IP address
- **Example:**
  ```env
  HOST=0.0.0.0
  ```

### `NODE_ENV` (Optional)

- **Default:** `development` (if not set)
- **Description:** Environment mode
- **Options:**
  - `development` - Allows all CORS origins, more verbose logging
  - `production` - Restricts CORS to FRONTEND_URL, optimized
- **Example:**
  ```env
  NODE_ENV=production
  ```

### `FRONTEND_URL` (Optional)

- **Default:** Empty (allows all origins in development)
- **Description:** Comma-separated list of allowed frontend URLs for CORS
- **Development:** Leave empty to allow all origins
- **Production:** Set specific URLs
- **Examples:**

  ```env
  # Single URL
  FRONTEND_URL=http://localhost:3000

  # Multiple URLs
  FRONTEND_URL=http://localhost:3000,http://192.168.1.100:3000

  # Production with HTTPS
  FRONTEND_URL=https://yourdomain.com,https://www.yourdomain.com
  ```

## Quick Setup

### For Local Development (Default)

**No `.env` file needed!** Just run:

```bash
npm start
```

### For Custom Port

Create `.env`:

```env
PORT=5004
```

### For Production

Create `.env`:

```env
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com,https://www.yourdomain.com
PORT=5003
HOST=0.0.0.0
```

### For Network Multiplayer (Recommended)

Create `.env`:

```env
HOST=0.0.0.0
PORT=5003
NODE_ENV=development
# Leave FRONTEND_URL empty to allow all origins
```

## Default Behavior (No .env)

If you don't create a `.env` file, the server will:

- ✅ Run on port `5003`
- ✅ Bind to `0.0.0.0` (accessible from network)
- ✅ Allow all CORS origins (development mode)
- ✅ Work perfectly for local network multiplayer

## Creating .env File

1. Copy the example:

   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your values:

   ```bash
   nano .env
   # or
   code .env
   ```

3. Restart the server:
   ```bash
   npm start
   ```

## Verification

After setting up `.env`, verify it's working:

```bash
# Check server starts
npm start

# Check health endpoint
curl http://localhost:5003/health

# Check network info (shows your config)
curl http://localhost:5003/api/network
```

## Common Configurations

### Minimal (Default)

```env
# No .env file needed
# Uses all defaults
```

### Local Development

```env
PORT=5003
HOST=0.0.0.0
NODE_ENV=development
```

### Production

```env
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
PORT=5003
HOST=0.0.0.0
```

### Custom Port

```env
PORT=8080
```

### Localhost Only

```env
HOST=127.0.0.1
PORT=5003
```

## Troubleshooting

### Port Already in Use

```env
PORT=5004
```

### CORS Errors in Production

```env
NODE_ENV=production
FRONTEND_URL=http://your-frontend-url:port
```

### Can't Access from Network

```env
HOST=0.0.0.0
```

## Summary

| Variable       | Required | Default       | Purpose              |
| -------------- | -------- | ------------- | -------------------- |
| `PORT`         | No       | `5003`        | Server port          |
| `HOST`         | No       | `0.0.0.0`     | Network interface    |
| `NODE_ENV`     | No       | `development` | Environment mode     |
| `FRONTEND_URL` | No       | `""` (all)    | CORS allowed origins |

**Bottom line:** You can run the server without any `.env` file, but it's useful for customization! 🚀
