# 手动部署命令（复制粘贴到 PowerShell 或 Git Bash 均可）

## 前置：确认你的 GitHub 用户名

打开 <https://github.com/>，登录后看右上角头像旁边的名字。

当前站点配置的用户名已更新为 **`gangliuphys`**，网站地址为 `https://gangliuphys.github.io/`。

---

## 第 1 步：创建仓库

浏览器打开 <https://github.com/new>

| 字段 | 填写 |
|---|---|
| Repository name | `你的用户名.github.io`（必须完全一致） |
| Description | Personal Academic Homepage |
| 勾选 | Add a README file |
| 勾选 | Add .gitignore → None |
| License | None |
| 可见性 | **Public**（私有仓库无法开启 Pages） |

点 **Create repository**

---

## 第 2 步：生成访问令牌

打开 <https://github.com/settings/tokens/new>

| 字段 | 填写 |
|---|---|
| Note | deploy |
| Expiration | 30 days |
| 勾选 | `repo` |

点 **Generate token**，复制那串 `ghp_` 开头的字符（**只显示一次**）。

---

## 第 3 步：推送文件

在项目目录打开终端，依次执行（把 `你的用户名` 替换成实际值）：

```bash
cd "E:/OneDrive - stu.wzu.edu.cn/个人主页"

git config user.name "Gang Liu"
git config user.email "gangliuphys@gmail.com"

git remote remove origin 2>/dev/null
git remote add origin https://github.com/你的用户名/你的用户名.github.io.git

git branch -M main
git add -A
git commit -m "deploy: homepage"
```

推送时会提示输入：

- **Username**：填你的 GitHub 用户名
- **Password**：粘贴刚才的 Token（不是登录密码）

```bash
git push -u origin main
```

---

## 第 4 步：开启 Pages

打开 <https://github.com/你的用户名/你的用户名.github.io/settings/pages>

1. **Build and deployment** 下拉框选 `main` / `(root)`
2. 点 **Save**

等待 1–2 分钟，即可访问：

```
https://你的用户名.github.io/
```

---

## 如果以后更换 GitHub 用户名

需要改这几处（全文替换 `gangliuphys`）：

1. `index.html` — 搜 `og:url`
2. `robots.txt` — 搜 `Sitemap:`
3. `sitemap.xml` — 搜 `<loc>`

另外 `index.html` 里的页脚与 Hero 按钮 GitHub 链接（共 2 处）。
改完重新执行第 3 步的 `git add` / `commit` / `push`。

---

## 更新网站内容（以后每次改完都执行）

```bash
cd "E:/OneDrive - stu.wzu.edu.cn/个人主页"
git add -A
git commit -m "update: 描述本次改动"
git push
```

约 1 分钟后线上自动更新。

---

## 常见问题

**推送报 `Authentication failed`**
Token 错了或过期了，重新生成。注意不能复制到多余空格。

**推送报 `could not find remote repository`**
仓库名拼错了。必须是 `用户名.github.io`，大小写敏感。

**Pages 打不开或显示 404**
检查 Settings → Pages 的 Source 是否选了 `main` / `(root)`，而不是 `GitHub Actions`。

**图片不显示**
确认 `.nojekyll` 文件还在（项目根目录），这个文件让 Pages 不走 Jekyll 处理。

**中文字体异常 / 样式错乱**
刷新时用 `Ctrl + F5` 强制清缓存。Pages 有 CDN 缓存，通常一两分钟会自己更新。
