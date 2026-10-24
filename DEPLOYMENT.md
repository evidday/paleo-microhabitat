# Публикация SMASH ROOM

Репозиторий: https://github.com/evidday/paleo-microhabitat
Игра: https://evidday.github.io/paleo-microhabitat/

- `main`: исходники, правила и тесты. Запуск `src/index.html`; корневой index.html переадресует туда.
- `gh-pages`: содержимое src/ в корне, LICENSE и .nojekyll. GitHub Pages настроен на gh-pages /.
- Изменения публикуются обычными коммитами без force push. При следующей публикации обновить обе ветки.

До замены сохранены все ветки и запускаемая версия Paleo Microhabitat локально: ../game-backups/2026-10-23-paleo-before-smash/README.md. Предыдущие удалённые коммиты:
- main: 7f0c7163771bd6560cedfffa8fd31ed3da991653
- gh-pages: 85a0e5af70cbde6387daf8d2de1d7df1b0ad6fcb

Старую опубликованную версию можно восстановить из сохранённого коммита новым коммитом в gh-pages. Исходная история остаётся доступной. Конкретные пути локальной копии не требуются для работы сайта.

v0.13 опубликована 24 октября 2026: main f972737, gh-pages 670a0d2ba2582ff9e0f5439029dfa550898b5d0c. GitHub Pages status built для этого commit. Публичный адрес ?v=13 проверен полными матчами при 390/900/1440, касаниями, одиночным планировщиком и fallback. Предыдущий основной запуск сохранён как garden-v12.html; ранний — legacy.html. Последующие коммиты документации/тестов в main не меняют опубликованный игровой код.
