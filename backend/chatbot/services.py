"""Mock scheme assistant. Baad mein ask_scheme_assistant() ko dost ke LLM/RAG call se replace karna hai."""
import re

from schemes.models import Scheme

OCCUPATION_WORDS = {
    "farmer": ["farmer", "kisan", "किसान", "kheti", "खेती"],
    "student": ["student", "vidyarthi", "विद्यार्थी", "छात्र", "padhai"],
    "business": ["business", "dukan", "दुकान", "vyapar", "व्यापार"],
    "unemployed": ["unemployed", "berozgar", "बेरोजगार"],
    "artisan": ["artisan", "karigar", "कारीगर"],
}


def extract_profile(text):
    t = text.lower()
    profile = {}

    m = (
        re.search(r"(\d{1,3})\s*(?:saal|sal|years?|yrs?|yr|वर्ष|साल)", t)
        or re.search(r"age\s*(?:is)?\s*(\d{1,3})", t)
        or re.search(r"umar\s*(\d{1,3})", t)
    )
    if m:
        profile["age"] = int(m.group(1))

    m = re.search(r"(\d+(?:\.\d+)?)\s*(?:lakh|lac|लाख)", t)
    if m:
        profile["annual_income"] = int(float(m.group(1)) * 100000)

    for occupation, words in OCCUPATION_WORDS.items():
        if any(w in t for w in words):
            profile["occupation"] = occupation
            break

    if any(w in t for w in ["woman", "mahila", "female", "महिला", "ladki", "लड़की"]):
        profile["gender"] = "female"
    elif re.search(r"\bmale\b|\bpurush\b|पुरुष", t):
        profile["gender"] = "male"

    return profile


def _card(s):
    return {"id": s.id, "name": s.name, "level": s.level, "category": s.category, "official_link": s.official_link}


def ask_scheme_assistant(message, history=None):
    profile = extract_profile(message)
    active = Scheme.objects.filter(is_active=True)

    if profile:
        matched = [s for s in active if s.matches(profile)]
        found = ", ".join(f"{k}: {v}" for k, v in profile.items())
        if matched:
            reply = (
                f"Aapki jaankari ({found}) ke hisaab se ye {len(matched)} schemes mil sakti hain. "
                "Final eligibility ke liye official website zaroor check karein."
            )
        else:
            reply = f"Aapki jaankari ({found}) ke hisaab se koi scheme match nahi hui. Thodi aur detail bataiye."
    else:
        words = [w for w in re.findall(r"\w+", message.lower()) if len(w) > 3]
        matched = [s for s in active if any(w in (s.name + " " + s.description).lower() for w in words)]
        if matched:
            reply = "Aapke sawal se ye schemes related lagti hain:"
        else:
            reply = (
                "Mujhe aapki details samajh nahi aayi. Apni age, saalana income, occupation "
                "(kisan, student, business...) aur gender bataiye. Jaise: "
                "'Meri age 42 hai, income 3 lakh hai, main farmer hoon.'"
            )

    return {"reply": reply, "schemes": [_card(s) for s in matched[:8]], "profile_detected": profile}