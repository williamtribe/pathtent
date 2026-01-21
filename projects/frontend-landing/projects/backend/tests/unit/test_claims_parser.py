from app.services.claims_parser import extract_claims


def test_extract_claims__if_standard_korean_format__extracts_claims_section() -> None:
    # given
    text = """
    발명의 명칭: 테스트 특허

    【청구범위】
    청구항 1. 이것은 첫 번째 청구항입니다.
    청구항 2. 이것은 두 번째 청구항입니다.
    청구항 3. 이것은 세 번째 청구항으로 충분한 길이를 확보하기 위한 내용입니다.

    【발명의 설명】
    이것은 발명의 설명 부분입니다.
    """

    # when
    result = extract_claims(text)

    # then
    assert result.source == "claims"
    assert "청구항 1" in result.text
    assert "청구항 2" in result.text
    assert "청구항 3" in result.text
    assert "발명의 설명" not in result.text


def test_extract_claims__if_whitespace_format__extracts_claims_section() -> None:
    # given
    text = """
    발명의 명칭: 테스트

    청 구 범 위

    청구항 1. 공백이 있는 형식의 청구범위입니다.
    청구항 2. 이것도 청구항입니다.
    청구항 3. 충분한 길이를 확보하기 위한 추가 청구항입니다.

    발명의 설명
    이것은 설명입니다.
    """

    # when
    result = extract_claims(text)

    # then
    assert result.source == "claims"
    assert "청구항 1" in result.text
    assert "청구항 2" in result.text
    assert "발명의 설명" not in result.text


def test_extract_claims__if_numbered_claims__extracts_from_first_claim() -> None:
    # given
    text = """
    특허 문서

    청구항 1. 첫 번째 청구항으로 시작하는 형식입니다.
    청구항 2. 두 번째 청구항입니다.
    청구항 3. 세 번째 청구항으로 충분한 길이를 확보합니다.

    발명의 설명
    여기는 설명 부분입니다.
    """

    # when
    result = extract_claims(text)

    # then
    assert result.source == "claims"
    assert "청구항 1" in result.text
    assert "청구항 2" in result.text
    assert "발명의 설명" not in result.text


def test_extract_claims__if_english_patent__extracts_claims() -> None:
    # given
    text = """
    Patent Title: Test Patent

    Claims

    1. This is the first claim of the patent document.
    2. This is the second claim with sufficient length.
    3. This is the third claim to ensure minimum length requirement.

    Description
    This is the description section.
    """

    # when
    result = extract_claims(text)

    # then
    assert result.source == "claims"
    assert "first claim" in result.text
    assert "second claim" in result.text
    assert "Description" not in result.text


def test_extract_claims__if_alternative_korean_format__extracts_claims() -> None:
    # given
    text = """
    발명의 명칭: 대체 형식

    특허청구범위

    청구항 1. 특허청구범위 형식의 첫 번째 청구항입니다.
    청구항 2. 두 번째 청구항입니다.
    청구항 3. 세 번째 청구항으로 충분한 길이를 확보합니다.

    발명의 상세한 설명
    여기는 상세한 설명입니다.
    """

    # when
    result = extract_claims(text)

    # then
    assert result.source == "claims"
    assert "청구항 1" in result.text
    assert "청구항 2" in result.text
    assert "발명의 상세한 설명" not in result.text


def test_extract_claims__if_no_claims_section__returns_full_doc_fallback() -> None:
    # given
    text = """
    이것은 청구범위 섹션이 없는 문서입니다.
    단순한 텍스트만 포함되어 있습니다.
    청구범위 마커가 전혀 없습니다.
    """

    # when
    result = extract_claims(text)

    # then
    assert result.source == "full_doc"
    assert result.text == text


def test_extract_claims__if_very_short_match__tries_next_pattern() -> None:
    # given
    text = """
    발명의 명칭: 짧은 매칭 테스트

    【청구범위】
    짧음
    【발명의 설명】

    청구항 1. 이것은 다른 패턴으로 매칭되어야 하는 충분히 긴 청구항입니다.
    청구항 2. 두 번째 청구항도 포함됩니다.
    청구항 3. 세 번째 청구항으로 최소 길이를 만족합니다.

    발명의 설명
    설명 부분입니다.
    """

    # when
    result = extract_claims(text)

    # then
    assert result.source == "claims"
    assert "청구항 1" in result.text
    assert "청구항 2" in result.text
    # Should have fallen back to pattern 3 (numbered claims)


def test_extract_claims__if_claims_with_abstract_marker__extracts_correctly() -> None:
    # given
    text = """
    발명의 명칭: 요약 마커 테스트

    【청구범위】
    청구항 1. 요약 마커로 끝나는 청구범위입니다.
    청구항 2. 두 번째 청구항입니다.
    청구항 3. 세 번째 청구항으로 충분한 길이를 확보합니다.

    【요약】
    이것은 요약 부분입니다.
    """

    # when
    result = extract_claims(text)

    # then
    assert result.source == "claims"
    assert "청구항 1" in result.text
    assert "청구항 2" in result.text
    assert "【요약】" not in result.text
    assert "이것은 요약 부분입니다" not in result.text


def test_extract_claims__if_empty_document__returns_full_doc_fallback() -> None:
    # given
    text = ""

    # when
    result = extract_claims(text)

    # then
    assert result.source == "full_doc"
    assert result.text == ""


def test_extract_claims__if_claims_at_end_of_document__extracts_correctly() -> None:
    # given
    text = """
    발명의 명칭: 문서 끝 테스트

    청구항 1. 문서 끝에 위치한 청구항입니다.
    청구항 2. 두 번째 청구항으로 다음 섹션이 없습니다.
    청구항 3. 세 번째 청구항으로 충분한 길이를 확보합니다.
    """

    # when
    result = extract_claims(text)

    # then
    assert result.source == "claims"
    assert "청구항 1" in result.text
    assert "청구항 2" in result.text
    assert "청구항 3" in result.text
