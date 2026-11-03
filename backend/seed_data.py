"""The routes the project starts with. Only researched facts are here.

Nothing is invented: fares, travel times and coordinates are None (unknown)
until an admin verifies them. The two Hatoondi routes have no stops yet
because their road sequence has not been verified. AJ-GW-01 is a historical
college-transport reference (7 September 2018), not a current shared-auto
service.
"""

HISTORICAL_STOPS = [
    "GWECA Main Gate",
    "Makhupura Bypass",
    "DAV School",
    "Shalimar Colony",
    "Adarsh Nagar Gate",
    "Balupura Road",
    "7-Peppli Bali",
    "9 No. Petrol Pump",
    "Martindal Bridge",
    "Raja Cycle Choraha",
    "Gulab Bari Phatak",
    "Shopping Complex",
    "Gandhi Nagar",
    "Starting of Madar Flyover",
    "Ending of Madar Flyover",
    "Shri Ram Guest House",
    "Government Engineering College Ajmer",
]

ROUTES = [
    {
        "route_id": "HT-GW-01",
        "route_name": "Hatoondi – Makhupura – GWECA",
        "start_location": "Hatoondi, Ajmer",
        "end_location": "GWECA, Makhupura, Ajmer",
        "transport_type": "Shared Auto",
        "route_status": "Proposed",
        "verification_status": "Pending verification",
        "notes": (
            "General corridor is proposed. The exact shared-auto service, "
            "road sequence and stops are not yet verified."
        ),
        "source": "",
        "aliases": [
            "Hatundi",
            "Makhupura",
            "Government Women Engineering College Ajmer",
        ],
        "stops": [],
    },
    {
        "route_id": "HT-GW-02",
        "route_name": "Alternative Hatoondi – GWECA route",
        "start_location": "Hatoondi, Ajmer",
        "end_location": "GWECA, Makhupura, Ajmer",
        "transport_type": "Shared Auto",
        "route_status": "Proposed alternative",
        "verification_status": "Pending verification",
        "notes": (
            "Exact road sequence and stops are not confirmed. The admin can "
            "add them after road and field verification."
        ),
        "source": "",
        "aliases": [
            "Hatundi",
            "Makhupura",
            "Government Women Engineering College Ajmer",
        ],
        "stops": [],
    },
    {
        "route_id": "AJ-GW-01",
        "route_name": "GWECA – Ajmer City – Government Engineering College",
        "start_location": "GWECA Main Gate",
        "end_location": "Government Engineering College Ajmer",
        "transport_type": "College transport (historical)",
        "route_status": "Historical reference",
        "verification_status": "Historical reference",
        "notes": (
            "Historical GWECA transport schedule dated 7 September 2018. "
            "This is NOT a confirmed current shared-auto route."
        ),
        "source": "Historical GWECA transport schedule, 7 September 2018",
        "aliases": ["GWECA", "Government Women Engineering College Ajmer"],
        "stops": HISTORICAL_STOPS,
    },
]