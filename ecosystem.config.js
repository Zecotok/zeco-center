module.exports = {
  apps: [{
    name: "zecocenter",
    script: "npm",
    args: "start",
    cwd: "/home/ubuntu/zecocenter",
    watch: false,
    instances: 1,
    autorestart: true,
    max_memory_restart: "512M",
    env: {
      NODE_ENV: "production"
    }
  }]
} 