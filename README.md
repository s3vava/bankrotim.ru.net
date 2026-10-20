# bankrotim.ru.net

Локальный клон репозитория сайта банкротим.ру.

## Быстрый старт

### Установка Node.js
Node.js уже установлен (через winget). Проверить версию:

    node --version

### Тесты расчётов

Запуск всех проверок (тарифы, скидки, акции):

    node test_calc.js

Проверка синхронизации констант между index.html и test_calc.js:

    node check_sync.js

### Локальный сервер

Запустить статический сервер для проверки в браузере:

    npx --yes http-server -p 8080

или Python:

    py -m http.server 8080

После этого открыть http://localhost:8080

## Git

### Просмотр статуса

    git status

### Показать изменения

    git diff

### Коммит

    git add -A
    git commit -m "Описание изменений"

### Отправка в GitHub

    git push origin main

⚠️ **Push в main автоматически запускает деплой на GitHub Pages.**

### Откат изменений

Отменить все локальные изменения:

    git reset --hard origin/main

Отменить один файл:

    git checkout -- index.html

## Структура

- index.html — калькулятор банкротства
- 	est_calc.js — автоматические проверки расчётов
- check_sync.js — сверка констант между файлами
- .github/workflows/static.yml — деплой на GitHub Pages
