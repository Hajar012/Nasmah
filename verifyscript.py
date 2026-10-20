import csv
import os

def validate_csv(file_path="data/companies.csv"):
    if not os.path.exists(file_path):
        print(f"❌ Error: File not found at {file_path}")
        return False

    expected_headers = ['id', 'name_ar', 'name_en', 'career_url', 'linkedin_url', 'sector', 'location']

    with open(file_path, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        
        # 1. Check Headers
        if reader.fieldnames != expected_headers:
            print(f"❌ Header Mismatch! Expected: {expected_headers}, Got: {reader.fieldnames}")
            return False

        rows = list(reader)
        ids = [r['id'] for r in rows]

        # 2. Check Row Count & ID Uniqueness
        if len(ids) != len(set(ids)):
            print("❌ Duplicate IDs found in CSV!")
            return False

        print(f"✅ CSV Validation Passed! Total valid companies: {len(rows)}")
        print(f"✅ ID range: {ids[0]} to {ids[-1]}")
        return True

if __name__ == "__main__":
    validate_csv()