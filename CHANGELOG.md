# Changelog — directus-extension-item-navigation

Формат: [Keep a Changelog](https://keepachangelog.com/ru/1.1.0/) · версии по [SemVer](https://semver.org/lang/ru/).

> **Как читать «Безопасно обновлять»:**
> ✅ да — обратно совместимо, можно обновлять без проверок ·
> ⚠️ с проверкой — поведение/схема могли измениться, протестировать на dev ·
> ❌ breaking — есть несовместимые изменения, читать раздел перед обновлением.

## [1.1.1] — 2026-07-09
### Changed
- Сборка `dist` вынесена в GitHub Actions (авто при пуше в `src`); `dist` коммитится в репозиторий.
- build-инструменты (`@directus/extensions-sdk`, `typescript`, `vue`) — в `devDependencies`.
- Extension подключается к сайтам через список в образе/volume (git-тег), не через Marketplace-кнопку.

**Безопасно обновлять:** ✅ да — изменения только в инфраструктуре сборки, поведение расширения не менялось.

## Более ранняя история
- ci: авто-сборка dist через GitHub Actions (dist в git, без prepare) (2026-07-09)
- chore: prepare-скрипт + build-tools в dependencies (сборка при npm install из git) (2026-07-09)
- fix: sync navigation rewrite from domikisbrusa (respect preset sorting/filter/search, null/duplicate sort values) (2026-07-09)
- refactor: Update Message type import path from 'ai' to '@repo/shared/types'. (2026-01-30)
- Centralize UI translations and publish metadata (2026-01-26)
- Update .gitignore and docs for local deploy script (2026-01-10)

---
_Правила ведения: при каждом релизе добавляй секцию `## [версия] — дата` с подразделами Added/Changed/Fixed/Removed и строкой **Безопасно обновлять**. Ставь git-тег `v<версия>`._
