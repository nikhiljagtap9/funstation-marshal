# 1. Use official Node.js image as the build environment
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package.json and install dependencies
COPY package.json ./
RUN npm install

# Copy source files and build
COPY . .
RUN npm run build

# 4. Production image
FROM node:18-alpine AS runner
WORKDIR /app

# Only copy necessary files
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
ENV NODE_ENV=production
EXPOSE 8080
# Start the Next.js app
CMD ["npm", "start"]
ENV NODE_ENV=production