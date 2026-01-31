// Simple i18n implementation for Halal Kitchen

const translations = {
  en: {
    convert: "Convert",
    pasteRecipe: "Paste your recipe here...",
    confidenceScore: "Confidence Score",
    ingredientCategories: "Why were ingredients changed?",
    halalKitchen: "Halal Kitchen",
    isItHalal: "Is It Halal?",
    quickLookup: "Quick ingredient lookup",
    search: "Search",
    searching: "Searching...",
    halal: "Halal",
    haram: "Haram",
    questionable: "Questionable",
    unknown: "Unknown",
    commonAlternatives: "Common alternatives:",
    convertFullRecipe: "Convert Full Recipe",
    myHalalStandard: "My Halal Standard",
    explainLikeIm5: "Explain Like I'm 5",
    showCommunityTips: "Show community tips",
    communityTip: "Community Tip",
    copy: "Copy",
    download: "Download",
    saveRecipe: "Save Recipe",
    submitNewRecipe: "Submit New Recipe",
    hideRecipeForm: "Hide Recipe Form",
    savedRecipes: "Saved Recipes",
    publicRecipes: "Public Recipes",
    demoRecipe: "Try Demo Recipe",
    feedback: "Feedback",
    settings: "Settings",
    strictnessLevel: "Strictness Level",
    schoolOfThought: "School of Thought",
    noPreference: "No preference",
    strict: "Strict",
    standard: "Standard",
    flexible: "Flexible",
    strictDescription: "Avoid all cross-contamination mentions",
    standardDescription: "Follow mainstream halal guidelines",
    flexibleDescription: "Allow debatable items like vanilla extract"
  },
  ar: {
    convert: "تحويل",
    pasteRecipe: "الصق وصفة هنا...",
    confidenceScore: "نقاط الثقة",
    ingredientCategories: "لماذا تم تغيير المكونات؟",
    halalKitchen: "مطبخ حلال",
    isItHalal: "هل هو حلال؟",
    quickLookup: "البحث السريع عن المكونات",
    search: "بحث",
    searching: "جاري البحث...",
    halal: "حلال",
    haram: "حرام",
    questionable: "مشكوك فيه",
    unknown: "غير معروف",
    commonAlternatives: "البدائل الشائعة:",
    convertFullRecipe: "تحويل الوصفة الكاملة",
    myHalalStandard: "معاييري الحلال",
    explainLikeIm5: "اشرح كما لو كنت في الخامسة",
    showCommunityTips: "إظهار نصائح المجتمع",
    communityTip: "نصيحة المجتمع",
    copy: "نسخ",
    download: "تحميل",
    saveRecipe: "حفظ الوصفة",
    submitNewRecipe: "إرسال وصفة جديدة",
    hideRecipeForm: "إخفاء نموذج الوصفة",
    savedRecipes: "الوصفات المحفوظة",
    publicRecipes: "الوصفات العامة",
    demoRecipe: "جرب وصفة تجريبية",
    feedback: "التعليقات",
    settings: "الإعدادات",
    strictnessLevel: "مستوى الصرامة",
    schoolOfThought: "المدرسة الفقهية",
    noPreference: "لا تفضيل",
    strict: "صارم",
    standard: "قياسي",
    flexible: "مرن",
    strictDescription: "تجنب جميع إشارات التلوث المتبادل",
    standardDescription: "اتبع إرشادات الحلال السائدة",
    flexibleDescription: "السماح بالعناصر القابلة للنقاش مثل مستخلص الفانيليا"
  },
  ur: {
    convert: "تبدیل",
    pasteRecipe: "اپنی ترکیب یہاں چسپاں کریں...",
    confidenceScore: "اعتماد کا اسکور",
    ingredientCategories: "اجزاء کیوں تبدیل کیے گئے؟",
    halalKitchen: "حلال کچن",
    isItHalal: "کیا یہ حلال ہے؟",
    quickLookup: "اجزاء کی فوری تلاش",
    search: "تلاش",
    searching: "تلاش ہو رہی ہے...",
    halal: "حلال",
    haram: "حرام",
    questionable: "مشکوک",
    unknown: "نامعلوم",
    commonAlternatives: "عام متبادل:",
    convertFullRecipe: "مکمل ترکیب تبدیل کریں",
    myHalalStandard: "میرا حلال معیار",
    explainLikeIm5: "پانچ سالہ بچے کی طرح سمجھائیں",
    showCommunityTips: "کمیونٹی کے مشورے دکھائیں",
    communityTip: "کمیونٹی کا مشورہ",
    copy: "کاپی",
    download: "ڈاؤن لوڈ",
    saveRecipe: "ترکیب محفوظ کریں",
    submitNewRecipe: "نیا ترکیب جمع کریں",
    hideRecipeForm: "ترکیب فارم چھپائیں",
    savedRecipes: "محفوظ شدہ ترکیبیں",
    publicRecipes: "عوامی ترکیبیں",
    demoRecipe: "ڈیمو ترکیب آزمائیں",
    feedback: "رائے",
    settings: "ترتیبات",
    strictnessLevel: "سختی کی سطح",
    schoolOfThought: "فکری مکتب",
    noPreference: "کوئی ترجیح نہیں",
    strict: "سخت",
    standard: "معیاری",
    flexible: "لچکدار",
    strictDescription: "تمام کراس آلودگی کے حوالوں سے بچیں",
    standardDescription: "روایتی حلال رہنما خطوط پر عمل کریں",
    flexibleDescription: "متنازعہ اشیاء جیسے ونیلا ایکسٹریکٹ کی اجازت دیں"
  },
  id: {
    convert: "Konversi",
    pasteRecipe: "Tempel resep Anda di sini...",
    confidenceScore: "Skor Kepercayaan",
    ingredientCategories: "Mengapa bahan diubah?",
    halalKitchen: "Dapur Halal",
    isItHalal: "Apakah Ini Halal?",
    quickLookup: "Pencarian bahan cepat",
    search: "Cari",
    searching: "Mencari...",
    halal: "Halal",
    haram: "Haram",
    questionable: "Dipertanyakan",
    unknown: "Tidak diketahui",
    commonAlternatives: "Alternatif umum:",
    convertFullRecipe: "Konversi Resep Lengkap",
    myHalalStandard: "Standar Halal Saya",
    explainLikeIm5: "Jelaskan Seperti Saya Berumur 5 Tahun",
    showCommunityTips: "Tampilkan tips komunitas",
    communityTip: "Tip Komunitas",
    copy: "Salin",
    download: "Unduh",
    saveRecipe: "Simpan Resep",
    submitNewRecipe: "Kirim Resep Baru",
    hideRecipeForm: "Sembunyikan Formulir Resep",
    savedRecipes: "Resep Tersimpan",
    publicRecipes: "Resep Publik",
    demoRecipe: "Coba Resep Demo",
    feedback: "Umpan Balik",
    settings: "Pengaturan",
    strictnessLevel: "Tingkat Kekakuan",
    schoolOfThought: "Mazhab",
    noPreference: "Tidak ada preferensi",
    strict: "Ketat",
    standard: "Standar",
    flexible: "Fleksibel",
    strictDescription: "Hindari semua penyebutan kontaminasi silang",
    standardDescription: "Ikuti pedoman halal arus utama",
    flexibleDescription: "Izinkan item yang dapat diperdebatkan seperti ekstrak vanila"
  }
};

let currentLanguage = "en";

// Initialize language from localStorage
if (typeof Storage !== "undefined") {
  const savedLanguage = localStorage.getItem("halalKitchenLanguage");
  if (savedLanguage && translations[savedLanguage]) {
    currentLanguage = savedLanguage;
  }
}

export const setLanguage = (lang) => {
  if (translations[lang]) {
    currentLanguage = lang;
    if (typeof Storage !== "undefined") {
      localStorage.setItem("halalKitchenLanguage", lang);
    }
  }
};

export const getLanguage = () => {
  return currentLanguage;
};

export const t = (key) => {
  return translations[currentLanguage]?.[key] || translations.en[key] || key;
};

export const getAvailableLanguages = () => {
  return Object.keys(translations).map((code) => ({
    code,
    name: {
      en: "English",
      ar: "العربية",
      ur: "اردو",
      id: "Bahasa Indonesia"
    }[code] || code
  }));
};

export default { t, setLanguage, getLanguage, getAvailableLanguages };
