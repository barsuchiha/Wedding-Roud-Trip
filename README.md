# Wedding Road Trip

Сайт-приглашение на свадьбу с RSVP-формой, защитой через Yandex SmartCaptcha, уведомлениями в Telegram и выгрузкой RSVP в XLSX на Яндекс Диск.

## Что умеет

- фронтенд на `React + Vite`
- backend на `Express`
- сохранение RSVP в `PostgreSQL`, если задан `DATABASE_URL`
- fallback в `data/rsvps.json`, если базы нет
- защита формы RSVP через `Yandex SmartCaptcha`
- уведомления в Telegram
- синхронизация RSVP в XLSX на Яндекс Диск

## Быстрый запуск через Docker

### 1. Подготовить переменные окружения

```bash
cp .env.example .env
```

Заполни в `.env` нужные значения:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `VITE_YANDEX_SMARTCAPTCHA_SITE_KEY`, если нужна капча
- `YANDEX_SMARTCAPTCHA_SERVER_KEY`, если нужна капча
- `YANDEX_DISK_OAUTH_TOKEN` при необходимости
- `YANDEX_DISK_FILE_PATH` при необходимости
- `DATABASE_URL` при необходимости

### 2. Запустить контейнер

```bash
docker compose up --build -d
```

Сайт будет доступен на:

```text
http://127.0.0.1:5001
```

### 3. Остановить проект

```bash
docker compose down
```

## Запуск без Docker

### 1. Установить зависимости

```bash
npm install
```

### 2. Подготовить `.env`

```bash
cp .env.example .env
```

### 3. Запустить проект

```bash
npm run dev
```

По умолчанию приложение поднимется на порту из `.env`.

## Полезные команды

```bash
npm run check
npm run build
npm run start
```

## Yandex SmartCaptcha

- чтобы включить капчу, укажи оба ключа: `VITE_YANDEX_SMARTCAPTCHA_SITE_KEY` и `YANDEX_SMARTCAPTCHA_SERVER_KEY`
- если ключи не заданы, форма RSVP продолжит работать без капчи
- сервер проверяет токен перед сохранением RSVP и передаёт IP пользователя в Yandex SmartCaptcha
- для локальной проверки добавь в настройки SmartCaptcha домен `localhost` или `127.0.0.1`
- для продакшена под `o2wedding.ru` добавь в SmartCaptcha домены `o2wedding.ru` и `www.o2wedding.ru`

## Выгрузка на Яндекс Диск

- по умолчанию RSVP выгружаются в `disk:/Wedding RSVP/rsvps.xlsx`
- в первой колонке файла есть порядковый номер гостя `guest_number`
- если очень нужно сохранить старый CSV-формат, можно явно указать путь с расширением `.csv` в `YANDEX_DISK_FILE_PATH`

## Прод под o2wedding.ru

Что уже готово:

- сайт умеет работать в Docker через `Dockerfile`
- есть готовый прод-композ с `nginx` и HTTPS-терминацией: `docker-compose.prod.yml`
- есть конфиг reverse proxy и редирект `www -> o2wedding.ru`: `deploy/nginx/o2wedding.ru.conf`
- meta-теги и canonical теперь можно привязать к публичному домену через `PUBLIC_SITE_URL`

Что нужно сделать на VM:

1. Создать VM в Yandex Cloud и открыть входящие порты `22`, `80`, `443`.
2. Установить Docker и Docker Compose plugin.
3. Положить проект на VM и создать `.env` на основе `.env.example`.
4. Указать в `.env`:
   - `PUBLIC_SITE_URL=https://o2wedding.ru`
   - остальные прод-ключи Telegram / SmartCaptcha / Yandex Disk
5. Положить сертификаты в папку `deploy/certs/` на VM с именами:
   - `deploy/certs/fullchain.pem`
   - `deploy/certs/privkey.pem`
6. Запустить:

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

Почему это важно:

- `PUBLIC_SITE_URL` прокидывается в Docker build как `build arg`, поэтому canonical и social meta в итоговом `index.html` собираются уже с `https://o2wedding.ru`

Что нужно сделать у регистратора REG.RU:

- для домена `o2wedding.ru` создать `A`-запись на публичный IPv4 адрес VM
- для `www.o2wedding.ru` создать ещё одну `A`-запись на тот же IP

Важный нюанс:

- сертификаты и приватный ключ не должны лежать в `client/` и не должны попадать в git
- для этого в `.gitignore` уже добавлены `client/cert/` и `deploy/certs/`

## Хранение RSVP

- если указан `DATABASE_URL`, RSVP сохраняются в PostgreSQL
- если `DATABASE_URL` нет, RSVP сохраняются в `data/rsvps.json`
- в Docker папка `data` примонтирована как volume, поэтому JSON не потеряется между перезапусками контейнера

## Переменные окружения

Пример:

```env
PORT=5001
PUBLIC_SITE_URL=https://o2wedding.ru
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=-1000000000000
# TELEGRAM_MESSAGE_THREAD_ID=123
# VITE_YANDEX_SMARTCAPTCHA_SITE_KEY=your_smartcaptcha_site_key
# YANDEX_SMARTCAPTCHA_SERVER_KEY=your_smartcaptcha_server_key
# DATABASE_URL=postgres://user:password@host:5432/dbname
# YANDEX_DISK_OAUTH_TOKEN=your_yandex_disk_oauth_token
# YANDEX_DISK_FILE_PATH=disk:/Wedding RSVP/rsvps.xlsx
```

## Сборка образа вручную

```bash
docker build -t wedding-road-trip .
docker run --rm -p 5001:5000 --env-file .env -v "$(pwd)/data:/app/data" wedding-road-trip
```
