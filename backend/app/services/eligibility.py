from collections import Counter
from operator import eq, ge, le

from app.schemas.catalog import Check, EligibilityOut, Match, SchemeSummary, Status

LABELS = {
    "age": "Age", "income": "Annual household income", "occupation": "Occupation",
    "state": "State or union territory", "residence": "Residence", "bpl": "BPL status",
    "farmer": "Farmer status", "landholding": "Landholding", "student": "Current student status",
    "education": "Education level", "disability": "Disability status", "gender": "Gender",
    "social_category": "Social category", "minority": "Minority community status",
    "employment": "Employment status", "marital_status": "Marital status",
    "street_vendor": "Street vendor status", "pregnancy_or_recent_birth": "Pregnancy or recent birth",
    "daughter_under_ten": "Girl child's age and guardian relationship",
}
COMPARISONS = {
    "eq": (eq, "must be"),
    "gte": (ge, "must be at least"),
    "lte": (le, "must be at most"),
    "in": (lambda actual, permitted: actual in permitted, "must be one of"),
}
ORDER = {Status.LIKELY: 0, Status.POSSIBLE: 1, Status.INELIGIBLE: 2}


def display(field, value):
    if isinstance(value, list):
        return ", ".join(display(field, item) for item in value)
    if isinstance(value, bool):
        return "Yes" if value else "No"
    if field == "income":
        return f"INR {value:,}"
    if field == "landholding":
        return f"{value:g} hectares"
    if field == "age":
        return f"{value} years"
    return str(value).replace("_", " ")


def criterion(field, operator, value):
    return f"{LABELS.get(field, field)} {COMPARISONS[operator][1]} {display(field, value)}"


def evaluate(scheme, profile):
    checks = []
    for rule in scheme.rules:
        actual = getattr(profile, rule.field, None)
        requirement = criterion(rule.field, rule.operator, rule.value)
        if actual is None:
            outcome = "missing"
            explanation = f"{requirement}. This information was not provided."
        else:
            passes = COMPARISONS[rule.operator][0](actual, rule.value)
            outcome = "pass" if passes else "fail"
            explanation = f"{requirement}. Your answer: {display(rule.field, actual)}."
        checks.append(Check(field=rule.field, outcome=outcome, explanation=explanation))

    outcomes = {check.outcome for check in checks}
    if "fail" in outcomes:
        status = Status.INELIGIBLE
    elif not checks or "missing" in outcomes:
        status = Status.POSSIBLE
        if not checks:
            checks.append(Check(field="rules", outcome="missing", explanation="No demo criteria are available."))
    else:
        status = Status.LIKELY
    return Match(scheme=SchemeSummary.model_validate(scheme), status=status, checks=checks)


def rank(schemes, profile):
    items = [evaluate(scheme, profile) for scheme in schemes]
    items.sort(key=lambda entry: (
        ORDER[entry.status],
        sum(check.outcome == "fail" for check in entry.checks),
        -sum(check.outcome == "pass" for check in entry.checks),
        sum(check.outcome == "missing" for check in entry.checks),
        entry.scheme.name.casefold(),
        entry.scheme.id,
    ))
    counts = Counter(item.status for item in items)
    categories = Counter(item.scheme.category.name for item in items if item.status != Status.INELIGIBLE)
    return EligibilityOut(items=items, counts={status: counts[status] for status in Status}, categories=categories)
