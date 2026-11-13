import sqlite3
import json
import os
from typing import List, Optional, Dict, Any
from .models import CaseDetail
from .seed_data import get_seed_cases
from .config import settings


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(settings.DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS cases (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            client_type TEXT NOT NULL,
            crn_or_ref TEXT NOT NULL,
            assigned_rm TEXT NOT NULL,
            status TEXT NOT NULL,
            data_json TEXT NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS audit_logs (
            id TEXT PRIMARY KEY,
            case_id TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            rm_name TEXT NOT NULL,
            action TEXT NOT NULL,
            details TEXT NOT NULL,
            hitl_enforced INTEGER DEFAULT 1
        )
    """)
    conn.commit()

    # Check if empty; if so, populate with seed cases
    cursor.execute("SELECT COUNT(*) as count FROM cases")
    row = cursor.fetchone()
    if row["count"] == 0:
        reset_seed_db(conn)
    conn.close()


def reset_seed_db(conn: Optional[sqlite3.Connection] = None) -> None:
    should_close = False
    if conn is None:
        conn = get_connection()
        should_close = True

    cursor = conn.cursor()
    cursor.execute("DELETE FROM cases")
    cursor.execute("DELETE FROM audit_logs")

    seed_cases = get_seed_cases()
    for case in seed_cases:
        case_dict = case.model_dump()
        cursor.execute(
            """
            INSERT INTO cases (id, name, client_type, crn_or_ref, assigned_rm, status, data_json)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                case.id,
                case.name,
                case.client_type.value,
                case.crn_or_ref,
                case.assigned_rm,
                case.status,
                json.dumps(case_dict)
            )
        )
        for audit in case.audit_trail:
            cursor.execute(
                """
                INSERT INTO audit_logs (id, case_id, timestamp, rm_name, action, details, hitl_enforced)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    audit.id,
                    audit.case_id,
                    audit.timestamp,
                    audit.rm_name,
                    audit.action,
                    audit.details,
                    1 if audit.hitl_enforced else 0
                )
            )

    conn.commit()
    if should_close:
        conn.close()


def get_all_cases() -> List[CaseDetail]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT data_json FROM cases ORDER BY id ASC")
    rows = cursor.fetchall()
    conn.close()
    return [CaseDetail(**json.loads(r["data_json"])) for r in rows]


def get_case_by_id(case_id: str) -> Optional[CaseDetail]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT data_json FROM cases WHERE id = ?", (case_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    return CaseDetail(**json.loads(row["data_json"]))


def save_case(case: CaseDetail) -> None:
    conn = get_connection()
    cursor = conn.cursor()
    case_dict = case.model_dump()
    cursor.execute(
        """
        INSERT INTO cases (id, name, client_type, crn_or_ref, assigned_rm, status, data_json, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET
            name=excluded.name,
            client_type=excluded.client_type,
            crn_or_ref=excluded.crn_or_ref,
            assigned_rm=excluded.assigned_rm,
            status=excluded.status,
            data_json=excluded.data_json,
            updated_at=CURRENT_TIMESTAMP
        """,
        (
            case.id,
            case.name,
            case.client_type.value,
            case.crn_or_ref,
            case.assigned_rm,
            case.status,
            json.dumps(case_dict)
        )
    )
    conn.commit()
    conn.close()


def append_audit_log(audit_dict: Dict[str, Any]) -> None:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO audit_logs (id, case_id, timestamp, rm_name, action, details, hitl_enforced)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            audit_dict["id"],
            audit_dict["case_id"],
            audit_dict["timestamp"],
            audit_dict["rm_name"],
            audit_dict["action"],
            audit_dict["details"],
            1 if audit_dict.get("hitl_enforced", True) else 0
        )
    )
    conn.commit()
    conn.close()
