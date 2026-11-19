import { createContext, useContext, useState } from "react";

const dict = {
  en: {
    complaints: "Complaints", dashboard: "Dashboard", manage: "Manage complaints",
    myDashboard: "My Dashboard", schemes: "Schemes", assistant: "AI Assistant", logout: "Logout",

    login: "Login", createAccount: "Create citizen account", username: "Username", password: "Password",
    fullName: "Full name", email: "Email", phone: "Phone", register: "Register",
    newCitizen: "New citizen? Register", haveAccount: "Already have an account? Login",

    fileComplaint: "File a complaint", titlePh: "Title", describePh: "Describe the problem",
    autoDetect: "Auto-detect department (AI)", addressPh: "Address / landmark",
    latPh: "Latitude", lngPh: "Longitude", useLocation: "Use my location",
    submitComplaint: "Submit complaint", myComplaints: "My complaints", noComplaints: "No complaints yet.",
    priority: "Priority", filed: "Filed", expected: "Expected resolution", officer: "Officer",
    linked: "Linked to existing complaint #{id}", yourRating: "Your rating",
    solved: "Is your problem solved?", ratingOpt: "Rating (optional)",
    feedbackPh: "Feedback (required if you reopen)", yesClose: "Yes, close it", noReopen: "No, reopen",
    dupDetail: "A similar complaint was reported very close to this location recently.",
    dupSame: "Same problem - add my report", dupDiff: "Different problem - file separately",
    cancel: "Cancel", existingComplaint: "Existing complaint", status: "Status",
    sentTo: "Complaint #{id} sent to {dept} (priority: {priority})", locFail: "Could not get your location",
    st_submitted: "Submitted", st_acknowledged: "Acknowledged", st_in_progress: "In progress",
    st_resolved: "Resolved", st_closed: "Closed", st_rejected: "Rejected", st_reopened: "Reopened",
    pr_high: "High", pr_medium: "Medium", pr_low: "Low",

    whichSchemes: "Which schemes can I get?", agePh: "Age", incomePh: "Annual family income (Rs)",
    occAny: "Occupation (any)", genderAny: "Gender (any)", female: "Female", male: "Male",
    checkElig: "Check eligibility", matches: "{n} schemes match.",
    guidance: "Guidance only. Please confirm eligibility on the official website.",
    browse: "Browse all schemes", searchPh: "Search schemes", allCat: "All categories",
    centralState: "Central + State", noSchemes: "No schemes found.", documents: "Documents",
    lastDate: "Last date", official: "Official website", save: "Save", saved: "Saved (remove)",
    level_central: "Central", level_state: "Uttarakhand",
    cat_student: "Student", cat_farmer: "Farmer", cat_women: "Women", cat_senior: "Senior Citizen",
    cat_health: "Health", cat_business: "Business", cat_housing: "Housing", cat_other: "Other",
    occ_student: "Student", occ_farmer: "Farmer", occ_business: "Business", occ_salaried: "Salaried",
    occ_unemployed: "Unemployed", occ_homemaker: "Homemaker", occ_artisan: "Artisan", occ_other: "Other",

    notifications: "Notifications", newCount: "{n} new", markRead: "Mark all read",
    noNotif: "No notifications yet.", announcements: "Announcements", noAnn: "No announcements.",
    savedSchemes: "My saved schemes", noSaved: "No saved schemes. Save from the Schemes page.",
    nearby: "Nearby government offices", searchOffices: "Search by name, area or department",
    noOffices: "No offices found.", openMaps: "Open in Maps",

    schemeAssistant: "Scheme Assistant",
    greeting: "Namaste! Tell me your age, income and occupation, and I will suggest schemes.",
    chatPh: "I am 42 years old, income 3 lakh, I am a farmer...", send: "Send",
    legalAI: "Legal AI", legalPh: "Describe your situation (e.g. my property dispute has been going on for 6 years)",
    analyze: "Analyze my case", possibleType: "Possible case type", docsReceived: "Documents received",
  },
  hi: {
    complaints: "शिकायतें", dashboard: "डैशबोर्ड", manage: "शिकायतें प्रबंधित करें",
    myDashboard: "मेरा डैशबोर्ड", schemes: "योजनाएँ", assistant: "AI सहायक", logout: "लॉग आउट",

    login: "लॉगिन", createAccount: "नागरिक खाता बनाएँ", username: "यूज़रनेम", password: "पासवर्ड",
    fullName: "पूरा नाम", email: "ईमेल", phone: "फ़ोन", register: "रजिस्टर करें",
    newCitizen: "नए नागरिक? रजिस्टर करें", haveAccount: "पहले से खाता है? लॉगिन करें",

    fileComplaint: "शिकायत दर्ज करें", titlePh: "शीर्षक", describePh: "समस्या का विवरण लिखें",
    autoDetect: "विभाग अपने आप पहचानें (AI)", addressPh: "पता / नज़दीकी लैंडमार्क",
    latPh: "अक्षांश", lngPh: "देशांतर", useLocation: "मेरी लोकेशन लें",
    submitComplaint: "शिकायत जमा करें", myComplaints: "मेरी शिकायतें", noComplaints: "अभी कोई शिकायत नहीं है।",
    priority: "प्राथमिकता", filed: "दर्ज की गई", expected: "संभावित समाधान", officer: "अधिकारी",
    linked: "पहले से दर्ज शिकायत #{id} से जुड़ी", yourRating: "आपकी रेटिंग",
    solved: "क्या आपकी समस्या हल हो गई?", ratingOpt: "रेटिंग (वैकल्पिक)",
    feedbackPh: "प्रतिक्रिया (दोबारा खोलने पर ज़रूरी)", yesClose: "हाँ, बंद करें", noReopen: "नहीं, दोबारा खोलें",
    dupDetail: "इस जगह के बहुत पास हाल ही में ऐसी ही शिकायत दर्ज हुई है।",
    dupSame: "वही समस्या - मेरी रिपोर्ट जोड़ें", dupDiff: "अलग समस्या - अलग से दर्ज करें",
    cancel: "रद्द करें", existingComplaint: "पहले की शिकायत", status: "स्थिति",
    sentTo: "शिकायत #{id} {dept} को भेजी गई (प्राथमिकता: {priority})", locFail: "आपकी लोकेशन नहीं मिल पाई",
    st_submitted: "दर्ज की गई", st_acknowledged: "स्वीकार की गई", st_in_progress: "प्रक्रिया में",
    st_resolved: "हल हो गई", st_closed: "बंद", st_rejected: "अस्वीकृत", st_reopened: "फिर से खोली गई",
    pr_high: "ज़्यादा", pr_medium: "मध्यम", pr_low: "कम",

    whichSchemes: "मुझे कौन सी योजनाएँ मिल सकती हैं?", agePh: "उम्र", incomePh: "परिवार की सालाना आय (रु)",
    occAny: "पेशा (कोई भी)", genderAny: "लिंग (कोई भी)", female: "महिला", male: "पुरुष",
    checkElig: "पात्रता जाँचें", matches: "{n} योजनाएँ मेल खाती हैं।",
    guidance: "यह केवल मार्गदर्शन है। कृपया आधिकारिक वेबसाइट पर पात्रता की पुष्टि करें।",
    browse: "सभी योजनाएँ देखें", searchPh: "योजनाएँ खोजें", allCat: "सभी श्रेणियाँ",
    centralState: "केंद्र + राज्य", noSchemes: "कोई योजना नहीं मिली।", documents: "दस्तावेज़",
    lastDate: "अंतिम तिथि", official: "आधिकारिक वेबसाइट", save: "सेव करें", saved: "सेव है (हटाएँ)",
    level_central: "केंद्र", level_state: "उत्तराखंड",
    cat_student: "विद्यार्थी", cat_farmer: "किसान", cat_women: "महिला", cat_senior: "वरिष्ठ नागरिक",
    cat_health: "स्वास्थ्य", cat_business: "व्यवसाय", cat_housing: "आवास", cat_other: "अन्य",
    occ_student: "विद्यार्थी", occ_farmer: "किसान", occ_business: "व्यवसायी", occ_salaried: "नौकरीपेशा",
    occ_unemployed: "बेरोज़गार", occ_homemaker: "गृहिणी", occ_artisan: "कारीगर", occ_other: "अन्य",

    notifications: "सूचनाएँ", newCount: "{n} नई", markRead: "सब पढ़ा हुआ करें",
    noNotif: "अभी कोई सूचना नहीं।", announcements: "घोषणाएँ", noAnn: "कोई घोषणा नहीं।",
    savedSchemes: "मेरी सेव की हुई योजनाएँ", noSaved: "कोई सेव की हुई योजना नहीं। योजनाएँ पेज से सेव करें।",
    nearby: "नज़दीकी सरकारी कार्यालय", searchOffices: "नाम, इलाके या विभाग से खोजें",
    noOffices: "कोई कार्यालय नहीं मिला।", openMaps: "मैप में खोलें",

    schemeAssistant: "योजना सहायक",
    greeting: "नमस्ते! अपनी उम्र, आय और पेशा बताइए, मैं योजनाएँ सुझाऊँगा।",
    chatPh: "मेरी उम्र 42 साल है, आय 3 लाख है, मैं किसान हूँ...", send: "भेजें",
    legalAI: "लीगल AI", legalPh: "अपनी स्थिति बताइए (जैसे: मेरा संपत्ति विवाद 6 साल से चल रहा है)",
    analyze: "मेरा केस जाँचें", possibleType: "संभावित केस प्रकार", docsReceived: "प्राप्त दस्तावेज़",
  },
};

const LangContext = createContext(null);
export const useLang = () => useContext(LangContext);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(localStorage.getItem("lang") || "en");

  const setLang = (l) => {
    localStorage.setItem("lang", l);
    setLangState(l);
  };

  const t = (key, vars = {}) => {
    let s = dict[lang]?.[key] ?? dict.en[key] ?? key;
    Object.entries(vars).forEach(([k, v]) => {
      s = s.replace(`{${k}}`, v);
    });
    return s;
  };

  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>;
}