module.exports = {
  apps: [
    {
      name: 'bot-777',
      script: 'npm',
      args: 'run start',
      cwd: './discord-bot',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};
