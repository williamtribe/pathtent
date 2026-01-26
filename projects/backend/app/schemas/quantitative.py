# @TODO-1 — Create quantitative analysis schemas
"""Quantitative analysis schemas for patent statistics."""

from pydantic import BaseModel, Field


class YearlyCount(BaseModel):
    """Patent count per year."""

    year: int = Field(..., description="Application year")
    count: int = Field(..., ge=0, description="Number of patents")


class TechFieldCount(BaseModel):
    """Patent count per technology field (LDA topic or IPC-based)."""

    field: str = Field(
        ..., description="Technology field name (LDA topic label or IPC description)"
    )
    count: int = Field(..., ge=0, description="Number of patents")
    percentage: float = Field(..., ge=0.0, le=100.0, description="Percentage of total")


class IPCCount(BaseModel):
    """Patent count per IPC code."""

    code: str = Field(..., description="IPC code (e.g., G06F)")
    description: str = Field(default="", description="IPC code description")
    count: int = Field(..., ge=0, description="Number of patents")
    percentage: float = Field(..., ge=0.0, le=100.0, description="Percentage of total")


class QuantitativeResult(BaseModel):
    """Quantitative analysis result for patent collection."""

    yearly_trend: list[YearlyCount] = Field(
        default_factory=list,
        description="Patent count by application year",
    )
    tech_field_distribution: list[TechFieldCount] = Field(
        default_factory=list,
        description="Patent distribution by technology field (based on LDA topics)",
    )
    ipc_distribution: list[IPCCount] = Field(
        default_factory=list,
        description="Top IPC codes distribution",
    )
