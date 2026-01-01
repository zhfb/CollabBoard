# CollabBoard 部署指南

本指南将帮助您在以下平台部署CollabBoard项目：
- **Supabase**：数据库（PostgreSQL）
- **Render**：后端服务
- **Vercel**：前端应用

## 项目概述

CollabBoard是一个协作看板应用，使用以下技术栈：
- 前端：Vue 3 + TypeScript + Vite
- 后端：Node.js + Express + Prisma
- 数据库：PostgreSQL (Supabase)
- 实时通信：Socket.io

## 部署前准备

### 1. 克隆项目

```bash
git clone <repository-url>
cd <repository-directory>
```

### 2. 创建GitHub仓库

将项目推送到GitHub仓库，以便后续在Render和Vercel上部署。

## 一、Supabase数据库配置

### 1. 创建Supabase项目

1. 访问 [Supabase官网](https://supabase.com/) 并登录
2. 点击「New Project」创建新项目
3. 填写项目名称、选择地区
4. 设置数据库密码（请妥善保存）
5. 点击「Create project」创建项目

### 2. 获取数据库连接URL

1. 项目创建完成后，进入项目控制台
2. 点击左侧导航栏的「Settings」→「Database」
3. 在「Connection string」部分，复制「PostgreSQL Connection String」
4. 确保URL格式为：`postgresql://<username>:<password>@<host>:<port>/<database_name>?schema=public`
postgresql://postgres:[Huaweicloud@123456]@db.bvyioibkxjwhndvhpibg.supabase.co:5432/postgres
### 3. 配置数据库扩展（可选）

如果需要使用额外的PostgreSQL扩展，可以在Supabase控制台中启用：
- 点击左侧导航栏的「SQL Editor」
- 运行SQL命令启用扩展，例如：`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`

## 二、Render后端部署

### 1. 连接GitHub仓库

1. 访问 [Render官网](https://render.com/) 并登录
2. 点击「New」→「Web Service」
3. 连接到您的GitHub仓库
4. 选择`collabboard-backend`目录作为服务目录

### 2. 配置服务

1. **Name**：输入服务名称（如`collabboard-backend`）
2. **Region**：选择合适的地区
3. **Branch**：选择主分支（如`main`或`master`）
4. **Root Directory**：`collabboard-backend`
5. **Runtime**：选择`Node.js`
6. **Build Command**：`npm install && npx prisma generate`
7. **Start Command**：`npm start`
8. **Environment Variables**：
   - 点击「Advanced」→「Add Environment Variable」
   - 添加以下环境变量：
     - `DATABASE_URL`：Supabase数据库连接URL
     - `JWT_SECRET`：生成一个随机字符串作为JWT密钥
     - `PORT`：`3000`

### 3. 部署服务

点击「Create Web Service」开始部署。部署完成后，您将获得一个后端服务URL（如`https://collabboard-backend.onrender.com`）

### 4. 数据库迁移

1. 进入Render服务控制台
2. 点击「Shell」标签
3. 运行数据库迁移命令：

```bash
npx prisma migrate deploy
```

## 三、Vercel前端部署

### 1. 连接GitHub仓库

1. 访问 [Vercel官网](https://vercel.com/) 并登录
2. 点击「Add New」→「Project」
3. 连接到您的GitHub仓库
4. 选择`vue3-template`目录作为项目目录

### 2. 配置项目

1. **Name**：输入项目名称（如`collabboard-frontend`）
2. **Framework Preset**：选择`Vue.js`
3. **Root Directory**：`vue3-template`
4. **Build Command**：`npm run build`
5. **Output Directory**：`dist`

### 3. 配置环境变量

1. 点击「Environment Variables」
2. 添加以下环境变量：
   - `VITE_API_BASE_URL`：后端API URL（如`https://collabboard-backend.onrender.com/api`）
   - `VITE_SOCKET_BASE_URL`：Socket.io服务URL（如`https://collabboard-backend.onrender.com`）

### 4. 部署项目

点击「Deploy」开始部署。部署完成后，您将获得一个前端应用URL（如`https://collabboard-frontend.vercel.app`）

## 四、环境变量配置

### 后端环境变量（Render）

| 变量名 | 描述 | 示例值 |
|-------|------|--------|
| `DATABASE_URL` | Supabase数据库连接URL | `postgresql://user:password@db.example.com:5432/collabboard?schema=public` |
| `JWT_SECRET` | JWT密钥 | `your-super-secret-jwt-key` |
| `PORT` | 服务器端口 | `3000` |

### 前端环境变量（Vercel）

| 变量名 | 描述 | 示例值 |
|-------|------|--------|
| `VITE_API_BASE_URL` | 后端API URL | `https://collabboard-backend.onrender.com/api` |
| `VITE_SOCKET_BASE_URL` | Socket.io服务URL | `https://collabboard-backend.onrender.com` |

## 五、验证部署结果

### 1. 测试后端API

使用API测试工具（如Postman）测试后端API：

- 健康检查：`GET https://<backend-url>/api/health`
- 用户注册：`POST https://<backend-url>/api/auth/register`
- 用户登录：`POST https://<backend-url>/api/auth/login`
- 获取看板：`GET https://<backend-url>/api/boards`

### 2. 测试前端应用

1. 访问前端应用URL（如`https://collabboard-frontend.vercel.app`）
2. 尝试注册新用户
3. 创建看板和卡片
4. 测试拖拽功能和实时同步

## 六、常见问题与解决方案

### 1. 数据库连接错误

**问题**：后端服务无法连接到Supabase数据库

**解决方案**：
- 检查`DATABASE_URL`是否正确
- 确保Supabase项目的IP访问控制设置允许Render服务的IP地址
- 检查数据库密码是否正确

### 2. CORS错误

**问题**：前端无法调用后端API，出现CORS错误

**解决方案**：
- 确保后端Express应用配置了正确的CORS设置
- 检查Vercel环境变量`VITE_API_BASE_URL`是否正确

### 3. Socket.io连接错误

**问题**：实时同步功能无法正常工作

**解决方案**：
- 确保后端Socket.io服务器正常运行
- 检查Vercel环境变量`VITE_SOCKET_BASE_URL`是否正确
- 确保Render服务的端口配置正确

### 4. Prisma迁移错误

**问题**：数据库迁移失败

**解决方案**：
- 检查数据库连接URL是否正确
- 确保数据库用户有足够的权限
- 查看迁移日志，了解具体错误信息

## 七、持续部署

### 1. 后端持续部署

Render默认支持持续部署，当您向GitHub仓库推送更改时，Render会自动重新部署后端服务。

### 2. 前端持续部署

Vercel也默认支持持续部署，当您向GitHub仓库推送更改时，Vercel会自动重新部署前端应用。

## 八、监控与维护

### 1. 后端监控

- 使用Render控制台监控后端服务的运行状态和日志
- 设置报警规则，及时发现服务异常

### 2. 数据库监控

- 使用Supabase控制台监控数据库性能和使用情况
- 设置数据库备份策略，确保数据安全

### 3. 前端监控

- 使用Vercel控制台监控前端应用的访问情况
- 集成错误监控工具（如Sentry），及时发现和修复前端错误

## 九、扩展与优化

### 1. 数据库优化

- 根据查询模式创建合适的索引
- 定期清理无用数据
- 考虑使用Supabase的高级功能，如Row Level Security

### 2. 后端优化

- 使用缓存减少数据库查询
- 优化API响应时间
- 考虑使用负载均衡，提高服务可用性

### 3. 前端优化

- 优化页面加载速度
- 使用代码分割，减少初始加载体积
- 优化用户体验，提高应用性能

---

部署完成后，您的CollabBoard应用将完全可用，支持多用户协作和实时同步功能！
