#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
静态校验：标签配对、资源引用存在性、锚点有效性。
不依赖任何第三方库，直接解析 index.html。
"""
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent
HTML = ROOT / "index.html"

VOID_TAGS = {
    "area", "base", "br", "col", "embed", "hr", "img", "input",
    "link", "meta", "param", "source", "track", "wbr",
}

errors: list[str] = []
warnings: list[str] = []


def check_tags(html: str) -> None:
    """
    用标准库 HTMLParser 校验标签配对。
    比正则可靠：属性值内的尖括号（如 data-zh="...<em>x</em>..."）不会干扰判断，
    跨行标签也能正确处理。
    """
    from html.parser import HTMLParser

    class Validator(HTMLParser):
        def __init__(self) -> None:
            super().__init__(convert_charrefs=False)
            self.stack: list[tuple[str, int]] = []
            self.problems: list[str] = []

        def handle_starttag(self, tag, attrs):
            if tag not in VOID_TAGS:
                self.stack.append((tag, self.getpos()[0]))

        def handle_endtag(self, tag):
            if tag in VOID_TAGS:
                return
            if not self.stack:
                self.problems.append(f"第 {self.getpos()[0]} 行：多余的 </{tag}>")
                return
            open_tag, line = self.stack.pop()
            if open_tag != tag:
                self.problems.append(
                    f"第 {self.getpos()[0]} 行：</{tag}> 错误地关闭了"
                    f"第 {line} 行的 <{open_tag}>")

    v = Validator()
    v.feed(html)
    errors.extend(v.problems)
    for tag, line in v.stack:
        errors.append(f"第 {line} 行：<{tag}> 未闭合")


def check_assets(html: str) -> None:
    """检查 src / href 引用的本地资源是否存在"""
    refs = set(re.findall(r'(?:src|href)="(?!https?://|#|mailto:|data:)([^"]+)"', html))
    for ref in refs:
        # 去掉 ?v=版本号 这类查询串再判断文件是否存在
        path = ROOT / ref.split('?', 1)[0].split('#', 1)[0]
        if not path.exists():
            errors.append(f"资源缺失：{ref}")


def check_anchors(html: str) -> None:
    """检查页内锚点是否指向真实存在的 id"""
    ids = set(re.findall(r'\bid="([^"]+)"', html))
    anchors = set(re.findall(r'href="#([^"]+)"', html))
    missing = anchors - ids
    for anchor in missing:
        errors.append(f"锚点无对应 id：href=\"#{anchor}\"")


def check_bilingual(html: str) -> None:
    """
    检查中英文文案是否成对。
    用 HTMLParser 读取真实属性，避免正则被属性值内的尖括号截断。
    支持 data-zh / -text / -html / -href / -alt / -title 六种变体。
    """
    from html.parser import HTMLParser

    VARIANTS = ["", "-text", "-html", "-href", "-alt", "-title"]
    counts = {v: {"zh": 0, "en": 0} for v in VARIANTS}
    unpaired: list[str] = []

    class Auditor(HTMLParser):
        def handle_starttag(self, tag, attrs):
            keys = {k for k, _ in attrs}
            cls = dict(attrs).get("class", "")
            label = f'<{tag} class="{cls}">' if cls else f"<{tag}>"

            for v in VARIANTS:
                zh = "data-zh" + v in keys
                en = "data-en" + v in keys
                if zh:
                    counts[v]["zh"] += 1
                if en:
                    counts[v]["en"] += 1
                if zh != en:
                    unpaired.append(f"{v or 'base'}: {label[:70]}")

    a = Auditor()
    a.feed(html)

    for v in VARIANTS:
        c = counts[v]
        if c["zh"] != c["en"]:
            label = f'data-zh{v}' if v else "data-zh"
            warnings.append(f"{label} ({c['zh']}) 与 data-en{v} ({c['en']}) 数量不一致")

    if unpaired:
        shown = unpaired[:8]
        warnings.append(f"同一标签内中英属性未成对（{len(unpaired)} 处）：")
        warnings.extend("    ! " + u for u in shown)
        if len(unpaired) > len(shown):
            warnings.append(f"    ! …另有 {len(unpaired) - len(shown)} 处")


def check_sections(html: str) -> None:
    """确认参考模板中的核心板块都已具备"""
    required = {
        "hero (个人信息)": 'class="hero"',
        "news (动态)": 'id="news"',
        "research (研究兴趣)": 'id="research"',
        "publications (精选论文)": 'id="publications"',
        "projects (研究项目)": 'id="projects"',
        "education (教育背景)": 'id="education"',
        "experience (工作经历)": 'id="experience"',
        "gallery (相册)": 'id="gallery"',
        "footer (页脚)": 'class="footer"',
    }
    for label, needle in required.items():
        if needle not in html:
            errors.append(f"缺少板块：{label}")


def main() -> None:
    html = HTML.read_text(encoding="utf-8")

    check_tags(html)
    check_assets(html)
    check_anchors(html)
    check_bilingual(html)
    check_sections(html)

    # 统计信息
    counts = {
        "论文条目 (.pub)": len(re.findall(r'class="pub"', html)),
        "项目条目 (.grant)": len(re.findall(r'class="grant"', html)),
        "新闻条目 (.news__item)": len(re.findall(r'class="news__item"', html)),
        "教育条目 (.tl-item)": len(re.findall(r'class="tl-item"', html)),
        "兴趣条目 (.interest)": len(re.findall(r'class="interest"', html)),
        "全部论文 (.refitem)": len(re.findall(r'class="refitem"', html)),
        "相册照片 (.shot)": len(re.findall(r'<figure class="shot">', re.sub(r'<!--.*?-->', '', html, flags=re.S))),
    }

    print("=" * 52)
    print(" 静态校验结果")
    print("=" * 52)
    for label, n in counts.items():
        print(f"  {label:<22} {n}")

    print("-" * 52)
    if warnings:
        print(f"  提示 ({len(warnings)})：")
        for w in warnings[:12]:
            print(f"    ! {w}")
    if errors:
        print(f"  错误 ({len(errors)})：")
        for e in errors[:20]:
            print(f"    x {e}")
        print("=" * 52)
        sys.exit(1)

    print("  通过：标签配对、资源引用、锚点、板块完整性均正常")
    print("=" * 52)


if __name__ == "__main__":
    main()
