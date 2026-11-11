from django.core.management.base import BaseCommand

from schemes.models import Scheme

MY = "https://www.myscheme.gov.in/"

# (name, category, level, description, occupations, min_age, max_age, gender, link)
SCHEMES = [
    ("PM-KISAN", "farmer", "central", "Direct income support for farmer families.", "farmer", None, None, "any", "https://pmkisan.gov.in/"),
    ("PM Fasal Bima Yojana", "farmer", "central", "Crop insurance against crop loss.", "farmer", None, None, "any", "https://pmfby.gov.in/"),
    ("Kisan Credit Card", "farmer", "central", "Credit support for farming needs.", "farmer", None, None, "any", MY),
    ("National Scholarship Portal Schemes", "student", "central", "Scholarships for students through one portal.", "student", None, None, "any", "https://scholarships.gov.in/"),
    ("PM Vidyalaxmi", "student", "central", "Education loan support for higher studies.", "student", None, None, "any", MY),
    ("Pragati Scholarship for Girls", "student", "central", "Technical education scholarship for girl students.", "student", None, None, "female", MY),
    ("Beti Bachao Beti Padhao", "women", "central", "Welfare and education of the girl child.", "", None, None, "any", MY),
    ("PM Matru Vandana Yojana", "women", "central", "Support for pregnant and lactating mothers.", "", None, None, "female", MY),
    ("Sukanya Samriddhi Yojana", "women", "central", "Savings scheme for the girl child.", "", None, None, "any", MY),
    ("PM Ujjwala Yojana", "women", "central", "LPG connection for eligible women from poor households.", "", None, None, "female", MY),
    ("Indira Gandhi National Old Age Pension (NSAP)", "senior", "central", "Pension for elderly people from low-income households.", "", 60, None, "any", MY),
    ("Atal Pension Yojana", "senior", "central", "Pension scheme for retirement savings.", "", 18, 40, "any", MY),
    ("Ayushman Bharat PM-JAY", "health", "central", "Health insurance cover for eligible families.", "", None, None, "any", "https://pmjay.gov.in/"),
    ("PM Awas Yojana", "housing", "central", "Support for building or buying a home.", "", None, None, "any", "https://pmaymis.gov.in/"),
    ("PM Mudra Yojana", "business", "central", "Collateral-free loans for small businesses.", "business,unemployed", None, None, "any", "https://www.mudra.org.in/"),
    ("PM Vishwakarma", "business", "central", "Training and support for traditional artisans.", "artisan", 18, None, "any", "https://pmvishwakarma.gov.in/"),
    ("Stand-Up India", "business", "central", "Loans for women and SC/ST entrepreneurs.", "business,unemployed", None, None, "any", MY),
    ("Uttarakhand Farmer Pension Scheme", "farmer", "state", "Pension support for farmers in Uttarakhand.", "farmer", None, None, "any", MY),
    ("Uttarakhand Destitute Widow Pension", "women", "state", "Pension for widows from low-income families.", "", None, None, "female", MY),
    ("Uttarakhand Deserted Women Pension", "women", "state", "Monthly pension for deserted and destitute women.", "", None, None, "female", MY),
    ("Teelu Rauteli Special Pension", "farmer", "state", "Special pension for disabled rural farmers.", "farmer", None, None, "any", MY),
    ("Mukhyamantri Swarozgar Yojana", "business", "state", "Self-employment support in Uttarakhand.", "business,unemployed", None, None, "any", MY),
    ("Udhyan Card", "farmer", "state", "Identification card for horticulture farmers.", "farmer", None, None, "any", MY),
    ("Uttarakhand Organic Farming Mission", "farmer", "state", "Support for organic farming and certification.", "farmer", None, None, "any", MY),
    ("Atal Ayushman Uttarakhand Yojana", "health", "state", "State health cover for residents of Uttarakhand.", "", None, None, "any", MY),
    ("Mukhyamantri Bal Poshan Yojana", "other", "state", "Nutrition support for undernourished children.", "", None, None, "any", MY),
]

# TODO: har scheme ke documents, benefits, last_date aur official link official site se verify karke admin panel mein bharo.
DEFAULT_DOCS = "Aadhaar card\nBank account details\nResidence proof"


class Command(BaseCommand):
    help = "Seed government schemes"

    def handle(self, *args, **options):
        for name, cat, level, desc, occ, min_age, max_age, gender, link in SCHEMES:
            Scheme.objects.update_or_create(
                name=name,
                defaults={
                    "category": cat, "level": level, "description": desc,
                    "occupations": occ, "min_age": min_age, "max_age": max_age,
                    "gender": gender, "official_link": link,
                    "documents": DEFAULT_DOCS,
                    "eligibility_text": "Please check the official website for full eligibility details.",
                },
            )
        self.stdout.write(self.style.SUCCESS(f"{len(SCHEMES)} schemes ready"))