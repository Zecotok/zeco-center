# Computer Use Docker Setup

This folder contains a Docker Compose setup for running the Anthropic Computer Use demo.

## Prerequisites

- Docker installed on your machine
- Docker Compose installed on your machine

## Getting Started

1. Make sure you're in the `computer use` directory:
   ```
   cd "computer use"
   ```

2. Start the container:
   ```
   docker-compose up
   ```

3. Access the various services:
   - VNC interface: http://localhost:6080
   - Streamlit interface: http://localhost:8501
   - Other services on ports 5900 and 8080

## Stopping the Container

To stop the container, press `Ctrl+C` in the terminal where you started it, or run:
```
docker-compose down
```

## Notes

- The ANTHROPIC_API_KEY is configured in the .env file
- Your local ~/.anthropic directory is mounted to /home/computeruse/.anthropic in the container 