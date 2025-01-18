# note-anywhere

## Prerequisites

### Install Bun
Bun is required for running the backend. Install it based on your operating system:

**macOS or Linux:**
```bash
curl -fsSL https://bun.sh/install | bash
```

**Windows:**
Install via Windows Subsystem for Linux (WSL):
1. Install WSL if you haven't already
2. Run the above curl command in your WSL terminal

### Install Dependencies

1. **Backend Setup**
```bash
cd backend
bun install
```


### Environment Setup
1. Getting your cloudflare api keys
   


2. Create a `.env` by copying `.env.example` file in the backend directory , and fill it in with the following variables:
```env
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_DATABASE_ID=your_database_id
CLOUDFLARE_D1_TOKEN=your_d1_token
```

## Development

### Running Backend
```bash
cd backend
bun run dev
```

### Running Frontend Extension
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select the project's root directory

## Deployment

### Deploy Backend to Cloudflare Workers
```bash
cd backend
bun run deploy
```

The backend will be deployed to Cloudflare Workers using the configuration in `wrangler.toml`.

## API Documentation
Once the backend is running, you can access the API documentation at:
- Swagger UI: `/ui`
- OpenAPI spec: `/doc`
