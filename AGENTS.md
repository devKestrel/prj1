# Repository Guidelines

이 문서는 `prd.md`(경마게임 PRD)를 기반으로 작성된 기여 가이드입니다. 추후 코드가 추가되면 구조/명령을 본 지침에 맞춰 정리하세요.

## 프로젝트 구조 및 모듈 구성
- `prd.md` — 제품/기능 요구사항(PRD)
- `apps/server/` — Node.js(Express) + Socket.IO 서버
- `apps/client/` — React + Canvas(빌드: Vite/Esbuild)
- `apps/desktop/` — 선택: Electron 패키징
- `packages/shared/` — 공용 타입/유틸
- `scripts/` — 개발 스크립트(`dev.ps1`, `build.ps1` 등)
- `docs/`, `assets/`, `data/` — 문서, 정적자원, 로컬 DB(SQLite)

## 빌드·테스트·개발 명령
- 설치: `pnpm i`
- 개발: 서버 `pnpm -C apps/server dev`, 클라이언트 `pnpm -C apps/client dev`
- 전체 빌드: `pnpm -r build` (워크스페이스)
- 테스트: `pnpm -r test`
- 린트/포맷: `pnpm -r lint`, `pnpm -r format`
Tip: PowerShell에서 스크립트가 막히면 `Set-ExecutionPolicy -Scope Process Bypass`.

## 코딩 스타일 & 네이밍
- 들여쓰기 2칸, 탭 금지, 최대 100열 권장.
- TypeScript 권장(미사용 시 JS 허용). 변수/함수 `camelCase`, 컴포넌트/클래스 `PascalCase`, 파일 `kebab-case`.
- PRD 기준으로 모듈을 분리하고, 순수 함수 우선·전역 상태 최소화.
- Prettier + ESLint로 포맷/정적분석 수행.

## 테스트 가이드
- 프론트: Vitest/Jest, 백엔드: Jest(또는 Vitest). 파일명 `*.spec.ts(x)`/`*.test.ts`.
- `apps/*` 구조를 `tests/` 또는 가까운 위치에서 미러링.
- 커버리지 목표 80% 이상. 핵심 경로·회귀 버그 우선.

## 커밋 & PR 가이드
- Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`.
- 작은 단위로 커밋, 하나의 논리 변경만 포함.
- PR에 문제 배경, 변경 요약, 검증 방법(로컬 실행 명령), UI 변경 시 스크린샷 포함.

## 보안 & 설정 팁
- 비밀값 커밋 금지: `.env.example` 제공, 로컬은 `.env.local` 사용.
- 개발 DB: `data/dev.sqlite`(SQLite), 운영 DB: PostgreSQL(자격증명은 환경변수).
- `.gitignore`에 `.env*`, 빌드 산출물, IDE 파일 추가.

## 에이전트 작업 지침
- PRD(`prd.md`)와 이 가이드를 우선 준수, 불필요한 광범위 리팩터링 지양.
- 변경 시 테스트·문서 동반 업데이트, 관련 없는 이슈는 건드리지 않음.
