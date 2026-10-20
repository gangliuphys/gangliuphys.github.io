#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
备用上传通道 —— git push 失败时用这个。

用法：
    python _push.py "提交说明" 文件1 文件2 ...

示例：
    python _push.py "更新论文列表" index.html
    python _push.py "修改样式" index.html assets/css/style.css

不带文件参数时，默认上传常用的三个文件。
"""
import base64
import json
import pathlib
import subprocess
import sys
import urllib.parse
import urllib.request
import urllib.error

OWNER = "gangliuphys"
REPO = "gangliuphys.github.io"
BRANCH = "main"
API = f"https://api.github.com/repos/{OWNER}/{REPO}/contents"

DEFAULT_FILES = ["index.html", "assets/css/style.css", "assets/js/site.js"]


def get_token() -> str:
    """从 git 凭据助手取出已保存的 GitHub Token"""
    p = subprocess.run(
        ["git", "credential", "fill"],
        input="protocol=https\nhost=github.com\n\n",
        capture_output=True, text=True, encoding="utf-8",
    )
    for line in p.stdout.splitlines():
        if line.startswith("password="):
            return line.split("=", 1)[1].strip()
    raise RuntimeError(
        "未找到 GitHub 凭据。\n"
        "请先执行一次 git push（输入用户名和密码/令牌）让凭据保存下来。"
    )


def enc(path: str) -> str:
    """把文件路径编码成 API 需要的格式"""
    return "/".join(urllib.parse.quote(s, safe="") for s in path.split("/"))


def call(method: str, url: str, token: str, payload=None):
    """调用 GitHub API"""
    req = urllib.request.Request(url, method=method)
    for k, v in [
        ("Authorization", f"Bearer {token}"),
        ("Accept", "application/vnd.github+json"),
        ("X-GitHub-Api-Version", "2022-11-28"),
        ("User-Agent", "uploader"),
    ]:
        req.add_header(k, v)

    data = json.dumps(payload).encode() if payload is not None else None
    if data:
        req.add_header("Content-Type", "application/json")

    try:
        with urllib.request.urlopen(req, data, timeout=90) as r:
            body = r.read().decode()
            return r.status, (json.loads(body) if body else {})
    except urllib.error.HTTPError as e:
        return e.code, {}


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    message = sys.argv[1]
    files = sys.argv[2:] or DEFAULT_FILES

    print(f"提交说明：{message}")
    print(f"待上传文件：{len(files)} 个\n")

    try:
        token = get_token()
    except RuntimeError as e:
        print(f"[错误] {e}")
        sys.exit(1)

    ok = fail = 0
    for rel in files:
        fp = pathlib.Path(rel)
        if not fp.exists():
            print(f"  [跳过] 本地不存在：{rel}")
            fail += 1
            continue

        raw = fp.read_bytes()

        # 先查远程是否已有此文件，拿到 sha 才能更新
        st, body = call("GET", f"{API}/{enc(rel)}?ref={BRANCH}", token)
        sha = body.get("sha") if st == 200 else None

        payload = {
            "message": message,
            "branch": BRANCH,
            "content": base64.b64encode(raw).decode(),
        }
        if sha:
            payload["sha"] = sha

        st, _ = call("PUT", f"{API}/{enc(rel)}", token, payload)

        mark = "✓" if st in (200, 201) else "✗"
        action = "更新" if sha else "新增"
        print(f"  {mark} {action} {rel}  ({len(raw)/1024:.1f}KB)  HTTP {st}")

        if st in (200, 201):
            ok += 1
        else:
            fail += 1

    print(f"\n成功 {ok}，失败 {fail}")
    if ok:
        print("等待 1–3 分钟后强制刷新（Ctrl+F5）查看网站")
    sys.exit(0 if fail == 0 else 1)


if __name__ == "__main__":
    main()