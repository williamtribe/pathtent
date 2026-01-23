import re
from collections import Counter
from itertools import combinations
from pydantic import BaseModel


class SNANode(BaseModel):
    id: int
    name: str
    label: str
    frequency: int = 0


class SNAEdge(BaseModel):
    source: int
    target: int
    weight: int


class YearlyData(BaseModel):
    year: int
    nodes: list[SNANode]
    edges: list[SNAEdge]
    patent_count: int


class SNAResult(BaseModel):
    nodes: list[SNANode]
    edges: list[SNAEdge]
    total_patents: int
    code_length: int
    year_range: tuple[int, int] | None = None
    yearly_data: list[YearlyData] | None = None


def extract_shortened_ipc_codes(ipc_str: str | None, code_length: int = 4) -> list[str]:
    if not ipc_str:
        return []

    ipc_str = str(ipc_str)
    ipc_codes = [code.strip() for code in ipc_str.split("|") if code.strip()]

    all_codes: list[str] = []
    for single_ipc in ipc_codes:
        codes: list[str] = []
        if "[" in single_ipc and "]" in single_ipc:
            outside_brackets = single_ipc.split("[")[0].strip()
            inside_brackets = single_ipc.split("[")[1].split("]")[0].strip()
            if outside_brackets:
                codes.append(outside_brackets)
            if inside_brackets:
                inside_codes = [code.strip() for code in inside_brackets.split(",")]
                codes.extend(inside_codes)
        else:
            codes = [single_ipc.strip()]
        all_codes.extend(codes)

    shortened_codes: list[str] = []
    for code in all_codes:
        if code_length == 4:
            match = re.match(r"([A-Z]\d{2}[A-Z])", code)
            if match:
                shortened_codes.append(match.group(1))
        elif code_length == 8:
            match = re.match(r"([A-Z]\d{2}[A-Z])[\s-]?(\d+)", code)
            if match:
                subclass = match.group(1)
                maingroup = match.group(2).zfill(3)[:3]
                shortened_codes.append(f"{subclass}-{maingroup}")

    return shortened_codes


class PatentRecord(BaseModel):
    ipc: str | None
    year: int | None


def parse_year(date_str: str | None) -> int | None:
    if not date_str or len(date_str) < 4:
        return None
    try:
        return int(date_str[:4])
    except ValueError:
        return None


def analyze_ipc_cooccurrence(
    patent_records: list[PatentRecord],
    code_length: int = 4,
    start_year: int | None = None,
    end_year: int | None = None,
    include_yearly: bool = True,
) -> SNAResult:
    filtered_records = patent_records
    if start_year is not None:
        filtered_records = [r for r in filtered_records if r.year and r.year >= start_year]
    if end_year is not None:
        filtered_records = [r for r in filtered_records if r.year and r.year <= end_year]

    all_combinations: list[tuple[str, str]] = []
    all_codes: list[str] = []

    for record in filtered_records:
        ipc_codes = extract_shortened_ipc_codes(record.ipc, code_length=code_length)
        unique_codes = list(set(ipc_codes))
        all_codes.extend(unique_codes)

        if len(unique_codes) >= 2:
            pairs = list(combinations(unique_codes, 2))
            sorted_pairs: list[tuple[str, str]] = [tuple(sorted(pair)) for pair in pairs]  # type: ignore
            all_combinations.extend(sorted_pairs)

    edge_counter = Counter(all_combinations)
    code_counter = Counter(all_codes)
    unique_codes_sorted = sorted(list(code_counter.keys()))

    ipc_to_id = {code: idx for idx, code in enumerate(unique_codes_sorted)}

    nodes = [
        SNANode(
            id=idx,
            name=code,
            label=code,
            frequency=code_counter[code],
        )
        for idx, code in enumerate(unique_codes_sorted)
    ]

    edges = [
        SNAEdge(
            source=ipc_to_id[source],
            target=ipc_to_id[target],
            weight=weight,
        )
        for (source, target), weight in edge_counter.items()
    ]

    years = [r.year for r in filtered_records if r.year]
    year_range = (min(years), max(years)) if years else None

    yearly_data: list[YearlyData] | None = None
    if include_yearly and year_range:
        yearly_data = []
        for year in range(year_range[0], year_range[1] + 1):
            year_records = [r for r in filtered_records if r.year and r.year <= year]
            if not year_records:
                continue

            year_combinations: list[tuple[str, str]] = []
            year_codes: list[str] = []

            for record in year_records:
                ipc_codes = extract_shortened_ipc_codes(record.ipc, code_length=code_length)
                unique_codes = list(set(ipc_codes))
                year_codes.extend(unique_codes)

                if len(unique_codes) >= 2:
                    pairs = list(combinations(unique_codes, 2))
                    sorted_pairs_year: list[tuple[str, str]] = [tuple(sorted(pair)) for pair in pairs]  # type: ignore
                    year_combinations.extend(sorted_pairs_year)

            year_edge_counter = Counter(year_combinations)
            year_code_counter = Counter(year_codes)
            year_unique_codes = sorted(list(year_code_counter.keys()))
            year_ipc_to_id = {code: idx for idx, code in enumerate(year_unique_codes)}

            year_nodes = [
                SNANode(id=idx, name=code, label=code, frequency=year_code_counter[code])
                for idx, code in enumerate(year_unique_codes)
            ]
            year_edges = [
                SNAEdge(source=year_ipc_to_id[src], target=year_ipc_to_id[tgt], weight=w)
                for (src, tgt), w in year_edge_counter.items()
            ]

            yearly_data.append(YearlyData(
                year=year,
                nodes=year_nodes,
                edges=year_edges,
                patent_count=len([r for r in filtered_records if r.year == year]),
            ))

    return SNAResult(
        nodes=nodes,
        edges=edges,
        total_patents=len(filtered_records),
        code_length=code_length,
        year_range=year_range,
        yearly_data=yearly_data,
    )
