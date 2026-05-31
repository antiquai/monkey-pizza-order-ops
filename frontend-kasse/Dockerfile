FROM node:24-alpine

WORKDIR /app

# Копируем только файлы зависимостей для кэширования слоев
COPY package*.json ./

RUN npm install

COPY . .

# Next.js использует порт 3000 внутри контейнера
EXPOSE 3000

# Запускаем в режиме разработки
CMD ["npm", "run", "dev"]