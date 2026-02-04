# 🐧 腾讯云/Linux 服务器部署指南 (VPS Deployment)

不需要购买 Zeabur，您可以直接部署到自己的腾讯云服务器！只需 3 步：

## 前置准备 (Prerequisites)
请登录您的服务器终端 (SSH) 并确保安装了 Node.js：
```bash
# 检查 Node 版本 (需 v18+)
node -v 

# 如果没安装，可以用这个命令快速安装 (以 Ubuntu/Debian 为例):
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

## 第一步：拉取代码 (Clone)
在您的服务器上：
```bash
# 1. 克隆您的仓库
git clone https://github.com/polarbearlin/ai-creative-studio.git

# 2. 进入目录
cd ai-creative-studio

# 3. 安装依赖
npm install
```

## 第二步：构建项目 (Build)
# 构建前端 (生成 dist 文件夹)
npm run build
```

**⚠️ 提示: 如果您的服务器配置较低 (如 1核2G)，构建可能会卡死。**
如果遇到这种情况，请改用「本地构建」方案：
1. 在您**自己的电脑**上运行 `npm run build`。
2. 将生成的 `dist` 文件夹压缩为 `dist.zip`。
3. 通过 SCP 或 FTP 上传到服务器的 `ai-creative-studio` 目录。
4. 在服务器上解压：`unzip dist.zip`。

## 第三步：运行 (Run)
我们使用 `pm2` 来让服务在后台常驻运行。

```bash
# 1. 全局安装 pm2 (如果还没有)
npm install -g pm2

# 2. 创建 .env 配置文件 (填入您的 Key)
# 这一步会自动打开编辑器，请把本地 .env 的内容复制进去，然后保存退出 (Ctrl+X -> Y -> Enter)
nano .env 

# 3. 启动服务
pm2 start ecosystem.config.cjs

# 4. 查看状态
pm2 status
```

## 🎉 成功！
现在访问 `http://您的服务器IP:3002` 即可看到项目！

(如果无法访问，请去腾讯云控制台 -> 防火墙 -> 开放 `3002` 端口 TCP)。
