FROM mirror.gcr.io/library/node:20-alpine AS base
WORKDIR /app
COPY package.json ./
RUN npm install --legacy-peer-deps
COPY . .
ARG NEXT_PUBLIC_API_URL=http://localhost:8080/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NODE_OPTIONS=--max-old-space-size=512
RUN rm -rf .next && mkdir -p public && npm run build && test -f .next/BUILD_ID

FROM mirror.gcr.io/library/node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=base /app /app
EXPOSE 3000
CMD ["npm", "start"]
