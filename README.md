# GEO Agent - AI品牌诊断官

## 这是什么东西

输入品牌名称，系统自动：
1. 调用 DeepSeek AI 分析品牌
2. 抓取百度搜索结果
3. 抓取知乎讨论
4. 生成专业诊断报告

## 部署步骤（总共10分钟）

### 第一步：注册 GitHub（3分钟）

1. 打开 https://github.com
2. 点绿色的 **Sign up** 按钮
3. 输入你的邮箱 → 点 **Continue**
4. 设置密码 → 点 **Continue**
5. 设置用户名 → 点 **Continue**
6. 回答两个问题（随便选）→ 点 **Continue**
7. 验证你是真人（点图片里的物品）
8. 去邮箱点验证链接
9. 完成！

### 第二步：上传代码到 GitHub（2分钟）

1. 登录 https://github.com
2. 点右上角 **+** 号 → **New repository**
3. **Repository name** 填：`geo-agent`
4. 点最下面的绿色按钮 **Create repository**
5. 看到新页面后，找 **uploading an existing file** 这几个字，点它
6. 把项目文件夹里的所有文件拖拽到网页里
7. 点绿色按钮 **Commit changes**

### 第三步：注册 Render（1分钟）

1. 打开 https://render.com
2. 点 **Sign up with GitHub**（用GitHub登录，不用另外注册）
3. 授权 Render 访问你的GitHub
4. 完成！

### 第四步：一键部署（1分钟）

1. 在 Render 页面，点 **New +** → **Web Service**
2. 找到你的 `geo-agent` 仓库，点 **Connect**
3. 往下拉，确认这几项：
   - **Name**: `geo-agent`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server/index.js`
   - **Plan**: 选 **Free**
4. 点最下面的 **Create Web Service**
5. 等 2-3 分钟，看到绿色勾勾就是部署好了！

### 第五步：复制网址

部署完成后，Render 会给你一个网址，类似：
```
https://geo-agent-xxx.onrender.com
```

**这个网址就是你的产品！** 发给客户就能用。

### 第六步：配置 DeepSeek API Key（诊断必须）

1. 打开 https://platform.deepseek.com
2. 用手机号注册
3. 点左侧 **API Keys**
4. 点 **创建API Key**，复制
5. 打开你的产品网址
6. 点 **开始诊断** → 粘贴 API Key → 确认

**之后就不用再配了**，Key 会保存在服务器上。

---

## 成本

| 项目 | 费用 |
|------|------|
| GitHub | 免费 |
| Render 服务器 | 免费 |
| DeepSeek API | 免费（注册送5000万tokens）|
| **总共** | **0元** |

## 文件说明

```
├── server/              ← 后端代码
│   ├── index.js         ← API服务器
│   ├── diagnosis.js     ← 诊断引擎
│   └── db.js            ← 数据库
├── dist/                ← 前端页面（已构建好）
├── package.json         ← 项目配置
└── render.yaml          ← Render部署配置
```
