from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from .models import CadenceStage, CadenceTimeline, CaseDetail, GapItem, GapStatus


def advance_cadence_stage(
    cadence: CadenceTimeline,
    target_stage: Optional[CadenceStage] = None,
    days_advance: float = 0.0
) -> CadenceTimeline:
    """
    Advances or transitions the cadence state machine deterministically.
    """
    if target_stage:
        cadence.stage = target_stage
    
    if days_advance > 0:
        cadence.clock_days += days_advance

    # Stage transitions based on clock days if not explicitly targeted
    if not target_stage:
        if cadence.clock_days >= 9.0:
            cadence.stage = CadenceStage.DAY_9_ESCALATE
        elif cadence.clock_days >= 6.0:
            cadence.stage = CadenceStage.DAY_6_CALL
        elif cadence.clock_days >= 3.0:
            cadence.stage = CadenceStage.DAY_3_REMINDER
        elif cadence.partial_reply_logged:
            cadence.stage = CadenceStage.EVENT_PARTIAL_REPLY
        else:
            cadence.stage = CadenceStage.DAY_0_DISPATCH

    # Generate talking points for Day 6 call
    if cadence.stage in (CadenceStage.DAY_6_CALL, CadenceStage.DAY_9_ESCALATE):
        cadence.talking_points = [
            "Acknowledge busy schedule and thank client for earlier progress",
            "Explain that completing the remaining documents unlocks tier-1 liquidity facilities",
            "Offer direct walkthrough of the secure portal or phone assistance for tricky items",
            "Establish agreed target submission date before closing the call"
        ]

    return cadence


def process_partial_reply(
    case: CaseDetail,
    received_items: List[str]
) -> Dict[str, Any]:
    """
    Processes a client partial submission:
    - Marks matched documents/gaps as resolved
    - Restarts the 3-day clock count for remaining items only (Section 4 rule)
    - Records history event
    """
    resolved_count = 0
    remaining_gaps: List[GapItem] = []
    
    for gap in case.gaps:
        # Check if gap matches any received items
        matched = any(item.lower() in gap.requirement.lower() or item.lower() in gap.doc_code.lower() for item in received_items)
        if matched:
            gap.status = GapStatus.OK
            gap.selected = False
            resolved_count += 1
        else:
            remaining_gaps.append(gap)

    # Partial reply restarts the 3-day count for remaining items only!
    case.cadence.clock_days = 0.0
    case.cadence.stage = CadenceStage.EVENT_PARTIAL_REPLY
    case.cadence.partial_reply_logged = True
    case.cadence.last_contact_date = datetime.now().strftime("%a %d %b")
    case.status = "PARTIAL_REPLY"
    
    event_entry = {
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "event": "Partial Reply Ingested",
        "detail": f"Client submitted {resolved_count} items. {len(remaining_gaps)} items remain outstanding. Clock restarted.",
        "resolved_items": received_items
    }
    case.cadence.history.append(event_entry)

    return {
        "resolved_count": resolved_count,
        "remaining_gaps_count": len(remaining_gaps),
        "new_stage": case.cadence.stage,
        "clock_days": case.cadence.clock_days
    }


def snooze_case(
    cadence: CadenceTimeline,
    days: int,
    reason: str
) -> CadenceTimeline:
    """
    Snoozes or pauses a case with an RM-provided reason (e.g. client on holiday).
    """
    cadence.is_snoozed = True
    cadence.snooze_reason = reason
    cadence.history.append({
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "event": "Cadence Paused / Snoozed",
        "detail": f"Paused for {days} days by RM. Reason: {reason}"
    })
    return cadence


def resume_case(cadence: CadenceTimeline) -> CadenceTimeline:
    """
    Resumes a snoozed case.
    """
    cadence.is_snoozed = False
    cadence.history.append({
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "event": "Cadence Resumed",
        "detail": f"Resumed active cadence progression."
    })
    return cadence
