# Express Backend Project

一个基于 Node.js + Express + PostgreSQL + Prisma ORM + JWT 认证 + Socket.io 的后端项目基础结构。

## 技术栈

- **Node.js**: JavaScript 运行时环境
- **Express**: Web 应用框架
- **PostgreSQL**: 关系型数据库
- **Prisma ORM**: 数据库访问工具
- **JWT**: 认证机制
- **Socket.io**: 实时通信库

## 项目结构

```
├── prisma/                  # Prisma ORM 相关文件
│   ├── schema.prisma        # 数据库模型定义
│   └── migrations/          # 数据库迁移文件
├── src/
│   ├── controllers/         # 控制器
│   │   └── authController.js  # 认证控制器
│   ├── middleware/          # 中间件
│   │   └── auth.js          # JWT 认证中间件
│   ├── prisma/              # Prisma 客户端实例
│   │   └── index.js         # Prisma 客户端导出
│   ├── routes/              # 路由
│   │   ├── authRoutes.js    # 认证路由
│   │   └── healthRoutes.js  # 健康检查路由
│   └── socket/              # Socket.io 配置
│       └── index.js         # Socket.io 初始化
├── .env                     # 环境变量配置
├── .env.example             # 环境变量示例
├── index.js                 # 项目主入口
├── package.json             # 项目依赖配置
└── README.md                # 项目说明文档
```

## 核心功能

### 认证系统
- 用户注册
- 用户登录
- 获取当前用户信息
- JWT 令牌验证

### 数据库模型
- 用户表 (User)

### 实时通信
- Socket.io 初始化配置

## 环境配置

1. 复制 `.env.example` 文件为 `.env`：

```bash
cp .env.example .env
```

2. 根据实际情况修改 `.env` 文件中的配置：

```env
# 数据库连接字符串
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/express_backend?schema=public"

# JWT 密钥
JWT_SECRET="your_jwt_secret_key_here_change_this_in_production"

# 前端 URL
FRONTEND_URL="http://localhost:3000"

# 服务器端口
PORT=3001
```

## 安装与启动

### 安装依赖

```bash
npm install
```

### 生成 Prisma 客户端

```bash
npm run prisma:generate
```

### 创建数据库迁移

```bash
npm run prisma:migrate
```

### 启动开发服务器

```bash
npm run dev
```

服务器将在 `http://localhost:3001` 启动。

## API 接口

### 认证接口

#### 注册
- **URL**: `/api/auth/register`
- **方法**: `POST`
- **请求体**:
  ```json
  {
    "username": "user123",
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **响应**:
  ```json
  {
    "user": {
      "id": 1,
      "username": "user123",
      "email": "user@example.com",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    },
    "token": "jwt_token_here"
  }
  ```

#### 登录
- **URL**: `/api/auth/login`
- **方法**: `POST`
- **请求体**:
  ```json
  {
    "username": "user123",
    "password": "password123"
  }
  ```
- **响应**:
  ```json
  {
    "user": {
      "id": 1,
      "username": "user123",
      "email": "user@example.com",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    },
    "token": "jwt_token_here"
  }
  ```

#### 获取当前用户信息
- **URL**: `/api/auth/me`
- **方法**: `GET`
- **请求头**:
  ```
  Authorization: Bearer jwt_token_here
  ```
- **响应**:
  ```json
  {
    "id": 1,
    "username": "user123",
    "email": "user@example.com",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
  ```

### 健康检查
- **URL**: `/api/health`
- **方法**: `GET`
- **响应**:
  ```json
  {
    "status": "ok",
    "message": "服务器运行正常"
  }
  ```

## 注意事项

1. 请确保 PostgreSQL 服务器已安装并运行。
2. 请确保已创建对应的数据库。
3. 生产环境中请使用复杂的 JWT_SECRET。
4. 生产环境中请配置合适的 CORS 策略。

## 许可证

ISC