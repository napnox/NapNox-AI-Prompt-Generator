#!/usr/bin/env python3
"""
Static sanity check for the WordPress plugin's PHP.

No PHP runtime is available in this environment, so this does the next best
thing: it strips strings/comments, verifies bracket balance, and resolves
every `Class::member` reference against the declarations in the plugin.
It is not a parser - run `php -l` locally for a real syntax check.
"""
import re
import sys
from pathlib import Path

PLUGIN = Path(__file__).resolve().parent.parent / "wordpress-plugin" / "napnox-prompt-generator"

# Classes/constants provided by WordPress itself, not by this plugin.
WORDPRESS_SYMBOLS = {
    "WP_REST_Server", "WP_Error", "WP_REST_Request", "WP_REST_Response", "WP_User",
    "PHP_INT_MAX", "self", "static", "parent",
}


def strip_code(src: str) -> str:
    """Blank out comments and string contents so brackets inside them don't count."""
    out = []
    i, n = 0, len(src)
    while i < n:
        ch = src[i]
        two = src[i:i + 2]
        if two == "//" or ch == "#":
            j = src.find("\n", i)
            i = n if j == -1 else j
        elif two == "/*":
            j = src.find("*/", i + 2)
            i = n if j == -1 else j + 2
        elif ch in "'\"":
            quote, j = ch, i + 1
            while j < n:
                if src[j] == "\\":
                    j += 2
                    continue
                if src[j] == quote:
                    break
                j += 1
            out.append(" ")
            i = j + 1
        elif two == "<<" and src[i:i + 3] == "<<<":
            m = re.match(r"<<<\s*'?\"?(\w+)'?\"?\r?\n", src[i:])
            if m:
                end = re.search(r"\n\s*" + m.group(1) + r"\b", src[i:])
                i = i + (end.end() if end else len(src) - i)
            else:
                out.append(ch)
                i += 1
        else:
            out.append(ch)
            i += 1
    return "".join(out)


def check_balance(path: Path, code: str) -> list:
    pairs = {")": "(", "]": "[", "}": "{"}
    stack, errors = [], []
    line = 1
    for ch in code:
        if ch == "\n":
            line += 1
        elif ch in "([{":
            stack.append((ch, line))
        elif ch in ")]}":
            if not stack:
                errors.append(f"{path.name}:{line}: unexpected closing '{ch}'")
            elif stack[-1][0] != pairs[ch]:
                open_ch, open_line = stack[-1]
                errors.append(f"{path.name}:{line}: '{ch}' closes '{open_ch}' opened on line {open_line}")
                stack.pop()
            else:
                stack.pop()
    for open_ch, open_line in stack:
        errors.append(f"{path.name}:{open_line}: '{open_ch}' is never closed")
    return errors


def main() -> int:
    files = sorted(PLUGIN.rglob("*.php"))
    if not files:
        print("No PHP files found.")
        return 1

    errors = []
    declared_classes = set()
    declared_members = {}   # class -> {names}
    references = []         # (file, line, class, member)

    for path in files:
        raw = path.read_text()
        code = strip_code(raw)

        if not raw.lstrip().startswith("<?php"):
            errors.append(f"{path.name}: does not start with <?php")
        # A trailing `?>` risks stray output; inline `?> ... <?php` for
        # templating (as in the settings page) is fine.
        if raw.rstrip().endswith("?>"):
            errors.append(f"{path.name}: ends with ?> (WordPress standards omit the final close tag)")

        errors += check_balance(path, code)

        current = None
        for num, text in enumerate(code.splitlines(), start=1):
            m = re.search(r"\b(?:final\s+|abstract\s+)?class\s+(\w+)", text)
            if m:
                current = m.group(1)
                declared_classes.add(current)
                declared_members.setdefault(current, set())
            if current:
                fn = re.search(r"\bfunction\s+(\w+)\s*\(", text)
                if fn:
                    declared_members[current].add(fn.group(1))
                for cm in re.finditer(r"\bconst\s+(\w+)", text):
                    declared_members[current].add(cm.group(1))
            for ref in re.finditer(r"\b(\w+)::(\w+)", text):
                references.append((path.name, num, ref.group(1), ref.group(2)))

    for fname, num, cls, member in references:
        if cls in WORDPRESS_SYMBOLS or cls.startswith("WP_"):
            continue
        if cls not in declared_classes:
            errors.append(f"{fname}:{num}: references unknown class {cls}")
        elif member not in declared_members.get(cls, set()):
            errors.append(f"{fname}:{num}: {cls}::{member} is not declared")

    print(f"Checked {len(files)} PHP files, {len(declared_classes)} classes, {len(references)} static references.")
    for cls in sorted(declared_classes):
        print(f"  - {cls}: {len(declared_members[cls])} members")

    if errors:
        print("\nProblems found:")
        for error in errors:
            print(f"  {error}")
        return 1

    print("\nNo bracket or reference problems found.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
