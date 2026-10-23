import csv
import os

def generate_company_ids(csv_path="data/companies.csv", prefix="A"):
    # التحقق من وجود الملف في مجلد data أو في المجلد الرئيسي
    if not os.path.exists(csv_path):
        csv_path = "companies.csv"

    # قراءة البيانات باستخدام مكتبة csv مع دعم الاقتباسات
    with open(csv_path, mode="r", encoding="utf-8") as infile:
        reader = csv.DictReader(infile)
        fieldnames = [f for f in reader.fieldnames if f]
        rows = list(reader)

    cleaned_rows = []
    # ترقيم الشركات تسلسلياً (A001, A002, ...)
    for idx, row in enumerate(rows, start=1):
        # تنظيف الأعمدة والتأكد من عدم وجود حقول غير معروفة
        row_dict = {k: v for k, v in row.items() if k in fieldnames}
        row_dict['id'] = f"{prefix}{idx:03d}"
        cleaned_rows.append(row_dict)

    # إعادة حفظ الملف بنفس التنسيق النظيف
    with open(csv_path, mode="w", encoding="utf-8", newline="") as outfile:
        writer = csv.DictWriter(outfile, fieldnames=fieldnames, quoting=csv.QUOTE_MINIMAL)
        writer.writeheader()
        writer.writerows(cleaned_rows)

    print(f"تم تحديث {len(cleaned_rows)} شركة بنجاح! المعرفات من {cleaned_rows[0]['id']} إلى {cleaned_rows[-1]['id']}")

if __name__ == "__main__":
    generate_company_ids()