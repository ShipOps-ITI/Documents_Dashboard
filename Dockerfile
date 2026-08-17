FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

ARG DATABASE_URL="postgresql://postgres:password@localhost:5432/shipment_db"
ENV DATABASE_URL=$DATABASE_URL

RUN npx prisma generate

RUN npm prune --omit=dev

COPY entrypoint.sh .

RUN sed -i 's/\r$//' entrypoint.sh

RUN chmod +x entrypoint.sh

EXPOSE 5000

CMD ["./entrypoint.sh"]
