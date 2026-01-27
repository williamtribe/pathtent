"""Quantitative analysis service for patent statistics."""

from collections import Counter

from app.schemas.lda import DocumentTopic, PatentForLDA, Topic
from app.schemas.quantitative import (
    IPCCount,
    QuantitativeResult,
    TechFieldCount,
    YearlyCount,
)


def extract_year(application_date: str | None) -> int | None:
    """
    Extract year from application_date.

    Supports formats: YYYYMMDD, YYYY-MM-DD, YYYY/MM/DD
    """
    if not application_date:
        return None
    # Take first 4 characters as year
    try:
        year_str = application_date[:4]
        year = int(year_str)
        # Sanity check: valid patent years (1900-2100)
        if 1900 <= year <= 2100:
            return year
    except (ValueError, IndexError):
        pass
    return None


def extract_ipc_codes(ipc_codes: list[str]) -> list[str]:
    """
    Extract and normalize IPC codes.

    Returns main IPC section (first 4 characters like 'G06F').
    """
    normalized = []
    for code in ipc_codes:
        if code and len(code) >= 4:
            # Take first 4 chars (section + class + subclass)
            normalized.append(code[:4].upper())
    return normalized


def get_ipc_description(code: str) -> str:
    """
    Get description for common IPC codes.

    Returns empty string for unknown codes.
    """
    # Common IPC section descriptions (abbreviated)
    ipc_descriptions = {
        "A01": "Agriculture",
        "A23": "Foods/Foodstuffs",
        "A47": "Furniture/Household",
        "A61": "Medical/Veterinary",
        "A63": "Sports/Games",
        "B01": "Physical/Chemical Processes",
        "B23": "Machine Tools",
        "B25": "Hand Tools",
        "B29": "Plastics Processing",
        "B32": "Layered Products",
        "B60": "Vehicles",
        "B62": "Land Vehicles",
        "B65": "Conveying/Packing",
        "C01": "Inorganic Chemistry",
        "C07": "Organic Chemistry",
        "C08": "Organic Macromolecular",
        "C09": "Dyes/Paints/Adhesives",
        "C12": "Biochemistry/Microbiology",
        "C22": "Metallurgy",
        "C23": "Coating Metallic",
        "D01": "Textiles/Yarns",
        "D06": "Textile Treatment",
        "E01": "Roads/Railways",
        "E02": "Hydraulic Engineering",
        "E04": "Building",
        "E05": "Locks/Keys",
        "F01": "Machines/Engines",
        "F02": "Combustion Engines",
        "F03": "Machines/Engines (Fluids)",
        "F04": "Pumps",
        "F16": "Machine Elements",
        "F21": "Lighting",
        "F24": "Heating/Ventilation",
        "F25": "Refrigeration",
        "F28": "Heat Exchange",
        "G01": "Measuring/Testing",
        "G02": "Optics",
        "G03": "Photography",
        "G05": "Controlling/Regulating",
        "G06": "Computing/Calculating",
        "G07": "Checking Devices",
        "G08": "Signaling",
        "G09": "Educating/Displaying",
        "G10": "Musical Instruments",
        "G11": "Information Storage",
        "G16": "ICT for Specific Fields",
        "H01": "Electric Elements",
        "H02": "Electric Power",
        "H03": "Electronic Circuitry",
        "H04": "Electric Communication",
        "H05": "Electric Techniques NEC",
        "H10": "Semiconductor Devices",
    }
    # Try exact match first
    if code in ipc_descriptions:
        return ipc_descriptions[code]
    # Try section match (first 3 chars)
    section = code[:3] if len(code) >= 3 else code
    return ipc_descriptions.get(section, "")


def analyze_quantitative(
    patents: list[PatentForLDA | dict],
    topics: list[Topic],
    documents: list[DocumentTopic],
) -> QuantitativeResult:
    """
    Perform quantitative analysis on patents.

    Args:
        patents: List of patents with optional metadata
        topics: LDA topics with labels
        documents: Patent-to-topic assignments

    Returns:
        QuantitativeResult with yearly trend, tech field distribution, and IPC distribution
    """
    # Build patent_id -> metadata lookup
    patent_metadata: dict[str, dict] = {}
    for patent in patents:
        if isinstance(patent, dict):
            patent_id = patent.get("id", "")
            metadata = patent.get("metadata", {})
        else:
            patent_id = patent.id
            metadata = patent.metadata.model_dump() if patent.metadata else {}
        patent_metadata[patent_id] = metadata

    # Build patent_id -> topic_id lookup
    patent_topics: dict[str, int] = {}
    for doc in documents:
        patent_topics[doc.patent_id] = doc.topic_id

    # Build topic_id -> label lookup
    topic_labels: dict[int, str] = {}
    for topic in topics:
        topic_labels[topic.id] = topic.label or f"Topic {topic.id + 1}"

    # 1. Yearly trend analysis
    yearly_trend = _analyze_yearly_trend(patent_metadata)

    # 2. Tech field distribution (based on LDA topics)
    tech_field_distribution = _analyze_tech_field_distribution(
        patent_topics, topic_labels, len(patents)
    )

    # 3. IPC code distribution
    ipc_distribution = _analyze_ipc_distribution(patent_metadata)

    return QuantitativeResult(
        yearly_trend=yearly_trend,
        tech_field_distribution=tech_field_distribution,
        ipc_distribution=ipc_distribution,
    )


def _analyze_yearly_trend(patent_metadata: dict[str, dict]) -> list[YearlyCount]:
    """Analyze patent application trend by year."""
    year_counts: Counter[int] = Counter()

    for metadata in patent_metadata.values():
        application_date = metadata.get("application_date")
        year = extract_year(application_date)
        if year:
            year_counts[year] += 1

    # Sort by year
    sorted_years = sorted(year_counts.items())
    return [YearlyCount(year=year, count=count) for year, count in sorted_years]


def _analyze_tech_field_distribution(
    patent_topics: dict[str, int],
    topic_labels: dict[int, str],
    total_patents: int,
) -> list[TechFieldCount]:
    """Analyze patent distribution by technology field (LDA topic)."""
    topic_counts: Counter[int] = Counter()

    for topic_id in patent_topics.values():
        topic_counts[topic_id] += 1

    # Sort by count (descending)
    sorted_topics = topic_counts.most_common()

    result = []
    for topic_id, count in sorted_topics:
        label = topic_labels.get(topic_id, f"Topic {topic_id + 1}")
        percentage = (count / total_patents * 100) if total_patents > 0 else 0.0
        result.append(
            TechFieldCount(
                field=label,
                count=count,
                percentage=round(percentage, 1),
            )
        )

    return result


def _analyze_ipc_distribution(
    patent_metadata: dict[str, dict],
    top_n: int = 10,
) -> list[IPCCount]:
    """Analyze patent distribution by IPC code (top N)."""
    ipc_counts: Counter[str] = Counter()

    for metadata in patent_metadata.values():
        ipc_codes = metadata.get("ipc_codes", [])
        normalized = extract_ipc_codes(ipc_codes)
        # Count each unique IPC per patent once
        for ipc in set(normalized):
            ipc_counts[ipc] += 1

    # Get top N IPC codes
    top_ipcs = ipc_counts.most_common(top_n)
    total = sum(ipc_counts.values())

    result = []
    for code, count in top_ipcs:
        percentage = (count / total * 100) if total > 0 else 0.0
        result.append(
            IPCCount(
                code=code,
                description=get_ipc_description(code),
                count=count,
                percentage=round(percentage, 1),
            )
        )

    return result
