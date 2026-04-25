FROM node:20-alpine
RUN apk add --no-cache python3 py3-pip
RUN pip3 install anthropic python-dotenv --break-system-packages
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]