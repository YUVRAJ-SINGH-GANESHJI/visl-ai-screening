import pandas as pd
from io import StringIO
from app.logger import get_logger

log = get_logger("csv_parser")

REQUIRED_RESPONSE_COLS = {"name", "email", "college", "branch", "cgpa"}
REQUIRED_TEST_COLS = {"name", "email", "test_la", "test_code"}

def parse_candidate_csv(file_content: bytes, filename: str) -> list[dict]:
    """Parse and validate candidate CSV data."""
    log.info("Parsing candidate CSV", filename=filename, size=len(file_content))

    try:
        df = pd.read_csv(StringIO(file_content.decode("utf-8")))
    except Exception as e:
        log.error("Failed to parse CSV file", filename=filename, error=str(e))
        raise ValueError(f"Invalid CSV format: {e}")

    # Validate required columns
    missing = REQUIRED_RESPONSE_COLS - set(df.columns.str.lower().str.strip())
    if missing:
        log.error("Missing required columns", missing=list(missing), filename=filename)
        raise ValueError(f"Missing required columns: {missing}")

    # Clean column names
    df.columns = df.columns.str.strip().str.lower()

    # Validate rows
    errors = []
    for idx, row in df.iterrows():
        if pd.isna(row.get("name")) or str(row["name"]).strip() == "":
            errors.append(f"Row {idx + 2}: Missing name")
        if pd.isna(row.get("email")) or "@" not in str(row.get("email", "")):
            errors.append(f"Row {idx + 2}: Invalid email")

    if errors:
        log.warning("CSV validation warnings", errors=errors[:10])

    candidates = df.fillna("").to_dict("records")
    log.info("CSV parsed successfully", candidate_count=len(candidates))
    return candidates


def parse_test_results_csv(file_content: bytes) -> list[dict]:
    """Parse test result CSV and validate scores."""
    log.info("Parsing test results CSV")

    try:
        df = pd.read_csv(StringIO(file_content.decode("utf-8")))
    except Exception as e:
        log.error("Failed to parse test CSV", error=str(e))
        raise ValueError(f"Invalid CSV format: {e}")

    df.columns = df.columns.str.strip().str.lower()
    missing = REQUIRED_TEST_COLS - set(df.columns)
    if missing:
        raise ValueError(f"Missing required columns: {missing}")

    # Validate score ranges
    for idx, row in df.iterrows():
        for col in ["test_la", "test_code"]:
            val = row.get(col)
            if pd.notna(val) and not (0 <= float(val) <= 100):
                log.warning(f"Score out of range at row {idx + 2}", column=col, value=val)

    return df.fillna("").to_dict("records")
