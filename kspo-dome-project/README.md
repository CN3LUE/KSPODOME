# KSPO DOME 에바뛰

React + TypeScript + Vite + Firebase Authentication 프로젝트입니다.

## 로컬 실행

```bash
npm install
npm run dev
```

## GitHub Pages 배포

1. 이 폴더 안의 모든 파일과 폴더를 GitHub 저장소 최상단에 업로드합니다.
2. GitHub 저장소의 `Settings > Pages`로 이동합니다.
3. `Build and deployment > Source`를 `GitHub Actions`로 선택합니다.
4. `Actions` 탭에서 `Deploy to GitHub Pages` 작업이 성공하는지 확인합니다.

## 관리자 로그인

일반 주소에는 관리자 버튼이 표시되지 않습니다. 배포 주소 뒤에 `?admin=1`을 붙여 접속합니다.

```text
https://사용자명.github.io/저장소명/?admin=1
```

Firebase Authentication 관리자 계정과 `admin: true` Custom Claim 설정이 필요합니다.

## 이미지

`public` 폴더 안내 파일을 확인하고 무대 및 부채 이미지를 추가하세요.
