import csv
import sys
import time
from pathlib import Path

import requests

TARGET_FRAGMENT = "linkedin.com/company/unavailable"
DEFAULT_CSV = "data/companies.csv"
DELAY_SECONDS = 2.0
TIMEOUT_SECONDS = 15

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}


def check(session, url):
    """Return (status, final_url, note)."""
    try:
        resp = session.get(
            url,
            headers=HEADERS,
            timeout=TIMEOUT_SECONDS,
            allow_redirects=True,
            stream=True,
        )
        final = resp.url
        status = resp.status_code
        resp.close()
    except requests.RequestException as e:
        return "error", "", type(e).__name__

    if TARGET_FRAGMENT in final:
        return "unavailable", final, ""
    if status in (999, 429):
        return "blocked", final, f"HTTP {status}"
    if status == 403:
        return "forbidden", final, "HTTP 403"
    if "authwall" in final or "/login" in final or "/signup" in final:
        return "login-wall", final, ""
    if status == 404:
        return "not-found", final, "HTTP 404"
    if status >= 400:
        return "http-error", final, f"HTTP {status}"
    return "ok", final, ""


def main():
    csv_path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(DEFAULT_CSV)
    if not csv_path.exists():
        print(f"✗ CSV not found: {csv_path}")
        sys.exit(1)

    print(f"→ Reading: {csv_path}")
    print(f"→ Target : {TARGET_FRAGMENT}")
    print(f"→ Delay  : {DELAY_SECONDS}s between requests\n")

    with csv_path.open("r", encoding="utf-8-sig", newline="") as f:
        rows = list(csv.DictReader(f))

    if not rows:
        print("✗ CSV is empty or missing headers.")
        sys.exit(1)

    # Tolerant column detection (case / naming variations)
    def find_col(candidates):
        for key in rows[0].keys():
            if key.strip().lower() in candidates:
                return key
        return None

    name_col = find_col({"name", "company", "company_name", "الجهة"})
    url_col = find_col({"linkedin_url", "linkedin", "linkedin_link"})
    id_col = find_col({"id", "no.", "no", "number"})

    if not name_col or not url_col:
        print("✗ Could not find 'name' and/or 'linkedin_url' columns.")
        print(f"  Detected headers: {list(rows[0].keys())}")
        sys.exit(1)

    session = requests.Session()
    unavailable, other_issues = [], []
    skipped_empty = 0

    for i, row in enumerate(rows, start=1):
        name = (row.get(name_col) or "").strip()
        url = (row.get(url_col) or "").strip()
        rid = (row.get(id_col) or "").strip() if id_col else str(i)

        if not url:
            skipped_empty += 1
            continue

        status, final, note = check(session, url)

        if status == "unavailable":
            unavailable.append((rid, name, url, final))
            print(f"[{rid}] {name} — ❌ UNAVAILABLE")
        elif status == "ok":
            print(f"[{rid}] {name} — ✅ ok")
        else:
            other_issues.append((rid, name, url, status, final, note))
            label = f"({note})" if note else ""
            print(f"[{rid}] {name} — ⚠ {status} {label}")

        time.sleep(DELAY_SECONDS)

    # ---------- Summary ----------
    print("\n" + "=" * 60)
    print(f"Checked {len(rows) - skipped_empty} links.")
    print(f"  Unavailable : {len(unavailable)}")
    print(f"  Skipped     : {skipped_empty} (empty URL)")
    print(f"  Other issues: {len(other_issues)}")
    print("=" * 60)

    if unavailable:
        print("\n❌ Companies with UNAVAILABLE LinkedIn pages:")
        for rid, name, url, final in unavailable:
            print(f"  • {name}")
            print(f"      original: {url}")
            print(f"      final   : {final}")

    if other_issues:
        print("\n⚠ Non-OK results (not necessarily unavailable):")
        for rid, name, url, status, final, note in other_issues:
            label = f"({note})" if note else ""
            print(f"  • {name} — {status} {label}")

    # ---------- Save report ----------
    if unavailable or other_issues:
        out_path = csv_path.with_name("linkedin_check_results.csv")
        with out_path.open("w", encoding="utf-8", newline="") as f:
            w = csv.writer(f)
            w.writerow(["id", "name", "original_url", "final_url", "status", "note"])
            for rid, name, url, final in unavailable:
                w.writerow([rid, name, url, final, "unavailable", ""])
            for rid, name, url, status, final, note in other_issues:
                w.writerow([rid, name, url, final, status, note])
        print(f"\n→ Report saved to: {out_path}")


if __name__ == "__main__":
    main()