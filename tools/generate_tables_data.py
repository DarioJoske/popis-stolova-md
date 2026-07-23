#!/usr/bin/env python3
import html
import json
import re
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree

ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "stolovipopis"
OUTPUT_FILE = ROOT / "tables-data.js"
NAMESPACE = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}


def natural_table_number(path):
    match = re.search(r"\d+", path.stem)
    return int(match.group(0)) if match else 0


def paragraph_text(paragraph):
    return "".join(
        node.text or ""
        for node in paragraph.findall(".//w:t", NAMESPACE)
    ).strip()


def read_docx_lines(path):
    with zipfile.ZipFile(path) as archive:
        document_xml = archive.read("word/document.xml")

    root = ElementTree.fromstring(document_xml)
    lines = []

    for paragraph in root.findall(".//w:p", NAMESPACE):
        text = re.sub(r"\s+", " ", paragraph_text(paragraph)).strip()
        if text:
            lines.append(text)

    return lines


def expand_guest_line(line):
    numbered_parts = re.split(r"(?<!\d)(?=\d+\.\s*)", line)
    parts = [
        re.sub(r"^\d+\.\s*", "", part).strip()
        for part in numbered_parts
        if part.strip()
    ]

    if len(parts) > 1:
        return parts

    return [re.sub(r"^\d+\.\s*", "", line).strip()]


def table_from_docx(path):
    lines = read_docx_lines(path)
    if not lines:
        raise ValueError(f"{path} is empty")

    name = lines[0]
    guests = []

    for line in lines[1:]:
        if line == name:
            continue
        guests.extend(guest for guest in expand_guest_line(line) if guest)

    table = {
        "name": name,
        "note": "Raspored sjedenja",
        "guests": guests,
    }

    if name == "Stol 4":
        table["seats"] = 12

    return table


def main():
    if not SOURCE_DIR.exists():
        raise SystemExit(f"Missing source folder: {SOURCE_DIR}")

    files = sorted(SOURCE_DIR.glob("*.docx"), key=natural_table_number)
    if not files:
        raise SystemExit(f"No .docx files found in {SOURCE_DIR}")

    tables = [table_from_docx(path) for path in files]
    payload = json.dumps(tables, ensure_ascii=False, indent=2)
    OUTPUT_FILE.write_text(
        "window.WEDDING_TABLES = " + payload + ";\n",
        encoding="utf-8",
    )

    guest_count = sum(len(table["guests"]) for table in tables)
    print(f"Generated {html.escape(str(OUTPUT_FILE))}: {len(tables)} tables, {guest_count} guests")


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Failed to generate table data: {error}", file=sys.stderr)
        raise
