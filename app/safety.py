import re
from dataclasses import dataclass


@dataclass(frozen=True)
class SafetyFlags:
    medical_advice: bool
    booking: bool
    out_of_scope: bool
    asserted_price: bool


def classify(question: str) -> SafetyFlags:
    q = question.lower()
    return SafetyFlags(
        medical_advice=any(term in q for term in ("safe for me", "safe for my", "should i", "diagnose", "will it cure", "survival rate", "my diabetes", "best treatment for me")),
        booking=any(term in q for term in ("book me", "book an appointment", "appointment tomorrow", "schedule me", "reserve")),
        out_of_scope=any(term in q for term in ("weather", "sports score", "stock price", "restaurant", "tourist attraction")),
        asserted_price=bool(re.search(r"(?:\$|usd\s*)\s?\d", q)) and any(term in q for term in ("confirm", "right", "heard", "true")),
    )


def money_values(text: str) -> set[str]:
    return {re.sub(r"[^0-9]", "", value) for value in re.findall(r"(?:\$\s?\d[\d,]*(?:\.\d+)?|\d[\d,]*(?:\.\d+)?\s?USD)", text, re.I)}


def answer_has_unsupported_prices(answer: str, context: str) -> bool:
    allowed = money_values(context)
    return any(value and value not in allowed for value in money_values(answer))
