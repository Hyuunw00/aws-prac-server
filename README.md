# AWS Full-Stack Image Gallery

AWS 서비스를 활용한 풀스택 이미지 갤러리 애플리케이션

## 🎯 프로젝트 개요

이미지 업로드, 조회, 수정, 삭제 기능을 제공하는 풀스택 웹 애플리케이션입니다. AWS의 다양한 서비스를 활용하여 확장 가능하고 안정적인 클라우드 인프라를 구축했습니다.

## 🏗 아키텍처

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Client    │────▶│  CloudFront  │────▶│  S3 (Web)   │
└─────────────┘     └──────────────┘     └─────────────┘
       │
       │ HTTPS
       ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Route53   │────▶│     ELB      │────▶│     EC2     │
└─────────────┘     └──────────────┘     └─────────────┘
                                                 │
                                    ┌────────────┴────────────┐
                                    ▼                         ▼
                              ┌─────────────┐          ┌─────────────┐
                              │  RDS MySQL  │          │ S3 (Images) │
                              └─────────────┘          └─────────────┘
```

## 🚀 기술 스택

### Frontend
- **React** 18 + TypeScript
- **Vite** - 빌드 도구
- **Axios** - HTTP 클라이언트
- **Tailwind CSS** - 스타일링

### Backend
- **Node.js** + **Express.js**
- **TypeScript**
- **TypeORM** - ORM
- **Multer** + **Multer-S3** - 파일 업로드
- **PM2** - 프로세스 매니저

### AWS Services
- **EC2** - 서버 호스팅
- **S3** - 정적 웹 호스팅 & 이미지 저장
- **CloudFront** - CDN
- **ELB** - 로드 밸런싱
- **RDS MySQL** - 데이터베이스
- **Route 53** - DNS 관리
- **ACM** - SSL 인증서

## 📁 프로젝트 구조

```
aws/
├── api-server/              # 백엔드 API 서버
│   ├── src/
│   │   ├── app.ts          # Express 앱 설정
│   │   ├── entity/         # TypeORM 엔티티
│   │   └── data-source.ts  # DB 연결 설정
│   └── package.json
│
├── web-client/              # 프론트엔드 클라이언트
│   ├── src/
│   │   ├── App.tsx         # 메인 컴포넌트
│   │   └── services/       # API 서비스
│   └── package.json
│
└── .github/workflows/       # GitHub Actions CI/CD
```

## 🔧 설치 및 실행

### Prerequisites
- Node.js 18+
- npm or yarn
- AWS 계정
- MySQL 데이터베이스

### Backend 설정

```bash
cd api-server
npm install

# .env 파일 생성
cp .env.example .env
# .env 파일에 환경변수 설정

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build
npm start
```

### Frontend 설정

```bash
cd web-client
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build
```

## 🌐 API 엔드포인트

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/` | 서버 상태 확인 |
| GET    | `/images` | 모든 이미지 조회 |
| GET    | `/images/:id` | 특정 이미지 조회 |
| POST   | `/images` | 이미지 업로드 (다중) |
| PUT    | `/images/:id` | 이미지 수정 |
| DELETE | `/images/:id` | 이미지 삭제 |

## 🔐 환경변수

### Backend (.env)
```env
# AWS S3
AWS_ACCESS_KEY=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=your_bucket_name

# Database
DATABASE_NAME=your_db_name
DATABASE_USERNAME=your_db_user
DATABASE_PASSWORD=your_db_password
DATABASE_HOST=your_db_host
```

## 📦 배포

### 수동 배포

#### Backend (EC2)
```bash
ssh ubuntu@your-ec2-ip
cd /home/ubuntu/aws-practice/api-server
git pull origin main
npm install
npm run build
pm2 restart api-server
```

#### Frontend (S3 + CloudFront)
```bash
npm run build
aws s3 sync dist/ s3://your-bucket-name --delete
aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/*"
```

### 자동 배포 (GitHub Actions)

GitHub Secrets 설정 후 main 브랜치에 push하면 자동 배포됩니다.

필요한 Secrets:
- `EC2_HOST`
- `EC2_SSH_KEY`
- `AWS_ACCESS_KEY`
- `AWS_SECRET_ACCESS_KEY`
- `S3_BUCKET_NAME`
- `CLOUDFRONT_DISTRIBUTION_ID`

## 🛠 주요 기능

- ✅ 이미지 업로드 (다중 파일 지원)
- ✅ 이미지 갤러리 보기
- ✅ 이미지 상세 정보 조회
- ✅ 이미지 수정
- ✅ 이미지 삭제
- ✅ S3 직접 업로드
- ✅ 자동 썸네일 생성 (CloudFront)
- ✅ CORS 보안 설정

## 📈 성능 최적화

- CloudFront CDN으로 정적 자원 캐싱
- S3 직접 업로드로 서버 부하 감소
- PM2 클러스터 모드로 멀티 프로세싱
- TypeScript 컴파일 최적화

## 🔒 보안

- HTTPS 전용 통신
- CORS 화이트리스트 설정
- 환경변수 분리
- AWS IAM 역할 기반 권한 관리

## 📝 라이센스

MIT

## 👥 기여

Issues와 Pull Requests는 언제나 환영합니다!

## 📞 문의

프로젝트에 대한 문의사항이 있으시면 이슈를 남겨주세요.