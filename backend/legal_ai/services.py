"""Mock legal analysis. Baad mein analyze_case() ko dost ke model (RAG + similar cases) se replace karna hai."""

CASE_TYPES = {
    "Property dispute": ["property", "zameen", "जमीन", "plot", "possession", "kabza", "कब्जा"],
    "Consumer complaint": ["consumer", "refund", "defective", "warranty", "product"],
    "Family matter": ["divorce", "talaq", "custody", "maintenance", "dowry", "दहेज"],
    "Labour / employment": ["salary", "termination", "wages", "employer", "नौकरी"],
    "Criminal matter": ["fir", "theft", "assault", "cheating", "fraud", "चोरी", "धोखाधड़ी"],
}


def analyze_case(description, files):
    t = description.lower()
    guess = next((name for name, words in CASE_TYPES.items() if any(w in t for w in words)), "Not identified")
    return {
        "status": "model_not_connected",
        "possible_case_type": guess,
        "documents_received": [{"name": f.name, "size_kb": round(f.size / 1024, 1)} for f in files],
        "similar_cases": [],
        "possible_provisions": [],
        "outcome_analysis": None,
        "message": (
            "Legal AI model abhi connect nahi hua hai. Connect hone par yahan similar cases, "
            "relevant legal provisions aur outcome analysis dikhenge."
        ),
        "disclaimer": (
            "This is general information, not legal advice. "
            "A qualified lawyer should review your specific case before you decide anything."
        ),
    }