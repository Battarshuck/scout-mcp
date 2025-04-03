FROM ubuntu:latest

RUN apt-get update && \
    apt-get install -y nmap \
    gobuster \
    unzip \
    net-tools \
    curl \
    nodejs \
    npm

RUN npm install -g deno

WORKDIR /app

COPY . .

ENTRYPOINT ["deno", "run", "-A", "server.ts"]