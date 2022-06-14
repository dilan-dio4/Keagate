"# Snow" 

*. sudo apt update
*. sudo apt upgrade
*. sudo apt install nginx
*. sudo systemctl enable nginx
* sudo nano /etc/nginx/sites-available/mysite `
  server {
      listen 80;
      listen [::]:80;
      server_name www.your_domain;

      location / {
        proxy_pass http://localhost:8081;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
      }
  }
`
*. sudo ln -s /etc/nginx/sites-available/mysite /etc/nginx/sites-enabled/
*. sudo systemctl restart nginx
*. curl -sL https://deb.nodesource.com/setup_14.x | sudo -E bash -
*. sudo apt-get install -y nodejs
*. sudo apt install build-essential
*. npm i -g pm2