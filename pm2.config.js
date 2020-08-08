module.exports = {
  apps: [
    {
      name: 'app',
      script: './lib/index.js',
      error_file: './logs/app-err.log',
      out_file: './logs/app-out.log'
    }
  ]
};