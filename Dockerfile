FROM kalilinux/kali-rolling:latest

RUN curl -fsSL https://deno.land/install.sh | sh

WORKDIR /app

COPY . .

ENTRYPOINT ["deno", "run", "-A", "server.ts"]