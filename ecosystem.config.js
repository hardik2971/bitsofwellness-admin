// PM2 process file: `pm2 start ecosystem.config.js`
module.exports = {
  apps: [
    {
      name: "bitsofwellness-admin",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3100",
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      max_memory_restart: "512M",
      env: { NODE_ENV: "production" },
    },
  ],
}
