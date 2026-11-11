"""Mock AI classifier. Baad mein is function ko asli model ki API call se replace karna hai."""

KEYWORDS = {
    "Pothole / Damaged road": ["pothole", "road", "sadak", "gadda", "गड्ढा", "सड़क"],
    "Broken bridge or culvert": ["bridge", "culvert", "pul", "पुल"],
    "Garbage not collected": ["garbage", "trash", "waste", "kachra", "कचरा", "गंदगी"],
    "Streetlight not working": ["streetlight", "street light", "lamp", "बत्ती"],
    "Drain / sewer blocked": ["drain", "sewer", "naali", "gutter", "नाली"],
    "Stray animals": ["stray", "dog", "cow", "awara", "आवारा"],
    "Water leakage": ["leak", "leakage", "pipe", "पाइप", "रिसाव"],
    "No water supply": ["no water", "water supply", "paani nahi", "पानी नहीं"],
    "Power cut": ["power cut", "no electricity", "outage", "बिजली गुल"],
    "Damaged electric pole or wire": ["pole", "wire", "transformer", "तार", "खंभा"],
    "Illegal parking": ["parking", "parked"],
    "Traffic signal not working": ["traffic signal", "signal", "traffic light"],
    "Wild animal sighting": ["leopard", "tiger", "elephant", "bear", "wild", "monkey", "तेंदुआ", "बाघ"],
    "Illegal tree cutting": ["tree cutting", "illegal cutting", "logging", "timber", "पेड़ कटाई"],
}

HIGH_PRIORITY_WORDS = [
    "accident", "danger", "dangerous", "urgent", "emergency", "live wire",
    "fire", "flood", "injured", "khatra", "खतरा",
]


def classify(text):
    t = text.lower()
    best, best_score = None, 0
    for category, words in KEYWORDS.items():
        score = sum(1 for w in words if w in t)
        if score > best_score:
            best, best_score = category, score

    priority = "high" if any(w in t for w in HIGH_PRIORITY_WORDS) else "medium"
    confidence = min(0.5 + 0.2 * best_score, 0.95) if best else 0.0
    return {"category": best, "priority": priority, "confidence": confidence}