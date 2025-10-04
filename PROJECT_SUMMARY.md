# AWS 프로젝트 구축 현황

## 🏗️ 전체 아키텍처

```
[사용자] → [Route 53] → [CloudFront] → [S3 (웹 클라이언트)]
                    ↓
                [ELB/ALB] → [EC2 (API 서버)] → [RDS MySQL]
                                    ↓
                                [S3 (이미지 저장)]
```

## 📁 프로젝트 구조

```
aws/
├── api-server/          # Express.js + TypeScript 백엔드
│   ├── src/
│   │   ├── app.ts       # 메인 서버 파일
│   │   ├── entity/      # TypeORM 엔티티
│   │   └── data-source.ts
│   ├── dist/            # 빌드된 JS 파일
│   └── package.json
│
├── web-client/          # React + TypeScript 프론트엔드
│   ├── src/
│   │   ├── services/api.ts  # API 통신
│   │   └── App.tsx
│   ├── dist/            # 빌드된 정적 파일
│   └── package.json
│
└── .github/workflows/   # CI/CD 설정 (준비됨)
```

## 🚀 구축된 AWS 서비스

### 1. **EC2 인스턴스**
- **역할**: API 서버 호스팅
- **설정**: 
  - Node.js 20, PM2로 프로세스 관리
  - 포트 80에서 Express 서버 실행
  - TypeORM으로 MySQL 연결

### 2. **ELB (Elastic Load Balancer)**
- **역할**: EC2 앞단에서 로드 밸런싱
- **도메인**: `api.theo-test.com`
- **SSL/TLS**: HTTPS 지원

### 3. **S3 버킷 (2개)**
- **이미지 저장용**:
  - 업로드된 이미지 파일 저장
  - Multer-S3로 직접 업로드
  
- **웹 호스팅용** (`theo-web-client`):
  - React 빌드 파일 호스팅
  - 정적 웹사이트 호스팅 활성화

### 4. **CloudFront**
- **역할**: CDN, HTTPS 제공
- **원본**: S3 정적 웹사이트
- **도메인**: `web.theo-test.com` (예정)

### 5. **RDS MySQL**
- **역할**: 데이터베이스
- **연결**: TypeORM으로 관리
- **테이블**: images (이미지 메타데이터)

### 6. **Route 53**
- **도메인 관리**:
  - `api.theo-test.com` → ELB
  - `web.theo-test.com` → CloudFront (예정)

## 🔧 주요 기능

### API 서버 (Express)
- ✅ 이미지 CRUD API
- ✅ S3 파일 업로드/삭제
- ✅ CORS 설정 (특정 도메인만 허용)
- ✅ TypeScript + TypeORM

### 웹 클라이언트 (React)
- ✅ 이미지 갤러리 UI
- ✅ 파일 업로드 기능
- ✅ API 연동 (axios)
- ✅ TypeScript

## 📝 환경변수 설정

### API 서버 (.env)
```
AWS_ACCESS_KEY=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_S3_BUCKET=xxx
DATABASE_NAME=xxx
DATABASE_USERNAME=xxx
DATABASE_PASSWORD=xxx
DATABASE_HOST=xxx
```

### CORS 허용 도메인
- `http://localhost:5173` (개발)
- `https://web.theo-test.com` (프로덕션)

## 🚦 배포 프로세스

### 현재 (수동)
1. **API 서버**: 
   - 코드 수정 → GitHub push → EC2에서 pull → build → PM2 restart

2. **웹 클라이언트**:
   - 코드 수정 → build → S3 업로드 → CloudFront 캐시 무효화

### 준비된 자동화 (GitHub Actions)
- `.github/workflows/deploy-server.yml`: EC2 자동 배포
- `.github/workflows/deploy-web.yml`: S3/CloudFront 자동 배포
- 필요시 GitHub Secrets 설정 후 활성화 가능

## 🎯 완료된 작업
- ✅ EC2 서버 구축 및 API 개발
- ✅ S3 이미지 업로드 기능
- ✅ RDS MySQL 연동
- ✅ React 웹 클라이언트 개발
- ✅ S3 정적 웹 호스팅
- ✅ CloudFront CDN 설정
- ✅ ELB 로드밸런서 설정
- ✅ CORS 설정
- ✅ CI/CD 워크플로우 준비

## 📌 다음 단계 (선택사항)
- [ ] GitHub Actions 활성화 (Secrets 설정)
- [ ] 도메인 SSL 인증서 적용
- [ ] CloudFront 캐싱 최적화
- [ ] 모니터링 설정 (CloudWatch)
- [ ] Auto Scaling 설정