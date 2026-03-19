# aiignore

AI 코딩 도구로부터 민감 파일을 보호하는 CLI.

AI 도구마다 ignore 방식이 다르다 — `.cursorignore`, `.geminiignore`, `.codeiumignore`, `.claude/settings.json`, `.aiignore` — 포맷도 다르고 알려지지 않은 우회 버그도 있다. `aiignore`는 프로젝트를 스캔하고, 사용 중인 도구를 감지하고, 각 도구에 맞는 설정 파일을 자동 생성한다.

## 빠른 시작

```bash
npx aiignore-cli init
```

또는 전역 설치:

```bash
npm install -g aiignore-cli
aiignore init
```

Node.js 18 이상.

## 왜 직접 안 만들고?

만들 수 있다. `.cursorignore` 하나 쓰는 데 30초면 된다. 그런데:

- Cursor는 `.cursorignore`, Claude Code는 `settings.json` deny 규칙, Gemini CLI는 `.geminiignore`, JetBrains는 `.aiignore`, Windsurf는 아직 `.codeiumignore`를 쓴다는 걸 알고 있는가?
- Cursor의 ignore가 "best-effort"이고 CVE가 2개 있다는 것, Gemini의 부정 패턴이 깨져있다는 것, Copilot은 ignore 파일 자체가 없다는 걸 알고 있는가?
- 새 프로젝트 세팅할 때마다 각 도구의 포맷을 찾아볼 생각인가?

`aiignore`가 조사를 대신 해준다. 각 도구의 보안 현황 데이터가 진짜 가치고, CLI는 그걸 적용하는 수단이다.

## 명령어

### `aiignore init`

![aiignore init](assets/init.png)

### `aiignore verify`

![aiignore verify](assets/verify.png)

```bash
aiignore                             # aiignore init과 동일
aiignore init                        # 자동 감지 후 생성
aiignore init --all                  # 감지 건너뛰고 전체 도구 대상
aiignore init --only cursor          # 특정 도구만
aiignore init --only cursor,gemini   # 여러 도구 지정 (쉼표 구분)
aiignore init --append               # 기존 파일에 누락 패턴만 추가
aiignore init --dry-run              # 미리보기 (파일 생성 안 함)
aiignore init --force                # 기존 파일 덮어쓰기
aiignore init -q                     # 무출력 모드

aiignore verify                      # 보호 상태 테이블
aiignore verify --ci                 # 미보호 시 exit 1
aiignore verify --strict             # unreliable 이상이면 exit 1
aiignore verify --json               # JSON 출력

aiignore list                        # 지원 도구 및 별칭 목록
```

## 지원 도구

| 도구 | 생성 파일 | 신뢰도 | 주요 이슈 |
|------|----------|--------|----------|
| Cursor | `.cursorignore` | 낮음 | "best-effort", Agent 우회, `@` 참조 우회 |
| Claude Code | `.claude/settings.json` | 중간 | `Read()` deny가 Bash cat도 차단 (테스트 확인) |
| Copilot | 가이드 문서만 | 없음 | 개인 개발자용 ignore 파일 없음 |
| Gemini CLI | `.geminiignore` | 낮음 | 부정 패턴 깨짐, `.env`/`.pem` 자체 차단 정책 있음 |
| JetBrains AI | `.aiignore` | 높음 | 가장 안정적. 민감 파일명은 AI가 자체 REDACT |
| Windsurf | `.codeiumignore` | 중간 | 부정 패턴이 `.gitignore` 무시 불가 |

## 보호 대상

기본 패턴 + `.gitignore`의 보안 관련 항목을 자동 병합:

| 분류 | 패턴 |
|------|------|
| 환경변수 | `.env`, `.env.*`, `.env.local` |
| 인증정보 | `credentials.json`, `service-account*.json`, `*secret*`, `token.json` |
| 키 | `*.pem`, `*.key`, `*.p12`, `*.pfx`, `*.jks` |
| SSH | `.ssh/`, `id_rsa*`, `id_ed25519*`, `id_ecdsa*` |
| 클라우드 | `.aws/`, `.gcp/`, `.azure/`, `gcloud/` |
| 앱 시크릿 | `config/secrets.yml`, `config/master.key`, `vault.json` |
| 데이터베이스 | `*.sqlite`, `*.db`, `dump.sql` |
| 인증서 | `*.crt`, `*.cer`, `*.ca-bundle` |

## 도구 별칭

`--only` 옵션에서 사용 가능 (쉼표로 여러 개 지정):

```
cursor                     -> Cursor
claude / claude-code       -> Claude Code
copilot                    -> GitHub Copilot
gemini / gemini-cli        -> Gemini CLI
jetbrains / jb             -> JetBrains AI
windsurf / codeium         -> Windsurf/Codeium
```

`aiignore list`로 전체 목록 확인 가능.

## 한계

어떤 AI 도구도 파일 접근을 100% 차단하지 못한다. 모든 도구의 공통 약점: Agent/터미널 모드에서 셸 명령으로 ignore 파일을 우회할 수 있다. Copilot은 개인 개발자용 ignore 자체가 없다.

이 도구는 방어의 한 레이어다. 프로덕션 시크릿은 시크릿 매니저, pre-commit hook(`gitleaks`, `trufflehog`), 프로젝트 디렉토리 외부 보관을 병행해야 한다.

도구별 상세 내용(CVE, 버그, 테스트 결과)은 [AI Coding Tool Security Reference](docs/test-report.md) 참고.

## 라이선스

Apache-2.0
