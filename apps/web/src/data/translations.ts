import type { Language } from '../types';

export const TRANSLATIONS: Record<Language, {
  tagline: string;
  subtagline: string;
  searchPlaceholder: string;
  popularCategories: string;
  recentSearches: string;
  voiceButton: string;
  voiceListening: string;
  startNegotiation: string;
  liveNegotiation: string;
  factBusHeader: string;
  bestDiscoveredOffer: string;
  recommendationHeader: string;
  dealScore: string;
  potentialSavings: string;
  sellerPortal: string;
  adminDashboard: string;
  disclaimer: string;
  improveOffer: string;
}> = {
  en: {
    tagline: 'PANCHAYAT AI',
    subtagline: 'Your Local Market Negotiation & Price-Discovery Agent',
    searchPlaceholder: 'What are you looking to buy today? (e.g. Laptop under ₹60,000)',
    popularCategories: 'Popular Categories',
    recentSearches: 'Recent Searches',
    voiceButton: 'Talk to Panchayat AI',
    voiceListening: 'Listening to your request...',
    startNegotiation: 'Start Live Negotiation',
    liveNegotiation: 'LIVE NEGOTIATION STREAM',
    factBusHeader: 'FACT BUS — Shared Negotiation Memory',
    bestDiscoveredOffer: 'Best Discovered Offer',
    recommendationHeader: 'Negotiation Complete — Recommended Deal',
    dealScore: 'Deal Score',
    potentialSavings: 'Potential Savings',
    sellerPortal: 'Seller Portal & Counter-Offer Center',
    adminDashboard: 'Market Intelligence Dashboard',
    disclaimer: 'Panchayat AI discovered the best competitive offer among the sellers it contacted.',
    improveOffer: 'Improve Offer / Match Benchmark'
  },
  hi: {
    tagline: 'पंचायत AI',
    subtagline: 'आपका स्थानीय बाजार मोलभाव और कीमत खोज सहायक',
    searchPlaceholder: 'आज आप क्या खरीदना चाहते हैं? (जैसे: ₹60,000 के अंदर लैपटॉप)',
    popularCategories: 'लोकप्रिय श्रेणियां',
    recentSearches: 'हाल की खोजें',
    voiceButton: 'पंचायत AI से बोलें',
    voiceListening: 'आपकी आवाज सुनी जा रही है...',
    startNegotiation: 'लाइव मोलभाव शुरू करें',
    liveNegotiation: 'लाइव मोलभाव स्ट्रीम',
    factBusHeader: 'फैक्ट बस — साझा मोलभाव मेमोरी',
    bestDiscoveredOffer: 'सर्वश्रेष्ठ खोजा गया ऑफर',
    recommendationHeader: 'मोलभाव पूरा हुआ — अनुशंसित डील',
    dealScore: 'डील स्कोर',
    potentialSavings: 'संभावित बचत',
    sellerPortal: 'विक्रेता पोर्टल और काउंटर ऑफर',
    adminDashboard: 'बाजार खुफिया डैशबोर्ड',
    disclaimer: 'पंचायत AI ने संपर्क किए गए विक्रेताओं में से सर्वश्रेष्ठ प्रतिस्पर्धी ऑफर खोजा।',
    improveOffer: 'ऑफर सुधारें / बेंचमार्क मैच करें'
  },
  kn: {
    tagline: 'ಪಂಚಾಯತ್ AI',
    subtagline: 'ನಿಮ್ಮ ಸ್ಥಳೀಯ ಮಾರುಕಟ್ಟೆ ಚೌಕಾಶಿ ಮತ್ತು ಬೆಲೆ ಶೋಧನೆ ಸಹಾಯಕ',
    searchPlaceholder: 'ನೀವು ಇಂದು ಏನನ್ನು ಖರೀದಿಸಲು ಬಯಸುತ್ತೀರಿ? (ಉದಾ: ₹60,000 ಒಳಗೆ ಲ್ಯಾಪ್ಟಾಪ್)',
    popularCategories: 'ಜನಪ್ರಿಯ ವರ್ಗಗಳು',
    recentSearches: 'ಇತ್ತೀಚಿನ ಹುಡುಕಾಟಗಳು',
    voiceButton: 'ಪಂಚಾಯತ್ AI ನೊಂದಿಗೆ ಮಾತನಾಡಿ',
    voiceListening: 'ನಿಮ್ಮ ವಿನಂತಿಯನ್ನು ಆಲಿಸಲಾಗುತ್ತಿದೆ...',
    startNegotiation: 'ಲೈವ್ ಚೌಕಾಶಿ ಪ್ರಾರಂಭಿಸಿ',
    liveNegotiation: 'ಲೈವ್ ಚೌಕಾಶಿ ಸ್ಟ್ರೀಮ್',
    factBusHeader: 'ಫ್ಯಾಕ್ಟ್ ಬಸ್ — ಹಂಚಿಕೆಯಾದ ಚೌಕಾಶಿ ಮೆಮೊರಿ',
    bestDiscoveredOffer: 'ಉತ್ತಮ ಕಂಡುಕೊಂಡ ಆಫರ್',
    recommendationHeader: 'ಚೌಕಾಶಿ ಪೂರ್ಣಗೊಂಡಿದೆ — ಶಿಫಾರಸು ಮಾಡಲಾದ ಡೀಲ್',
    dealScore: 'ಡೀಲ್ ಸ್ಕೋರ್',
    potentialSavings: 'ಸಾಧ್ಯವಿರುವ ಉಳಿತಾಯ',
    sellerPortal: 'ಮಾರಾಟಗಾರರ ಪೋರ್ಟಲ್',
    adminDashboard: 'ಮಾರುಕಟ್ಟೆ ಇಂಟೆಲಿಜೆನ್ಸ್ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    disclaimer: 'ಸಂಪರ್ಕಿಸಲಾದ ಮಾರಾಟಗಾರರಲ್ಲಿ ಪಂಚಾಯತ್ AI ಅತ್ಯುತ್ತಮ ಸ್ಪರ್ಧಾತ್ಮಕ ಆಫರ್ ಅನ್ನು ಕಂಡುಕೊಂಡಿದೆ.',
    improveOffer: 'ಆಫರ್ ಸುಧಾರಿಸಿ / ಆಫರ್ ನೀಡಿ'
  },
  ur: {
    tagline: 'پنچائت AI',
    subtagline: 'آپ کا مقامي مارکيٹ مول بھاو اور قيمت دريافت اسسٹنٹ',
    searchPlaceholder: 'آج آپ کيا خريدنا چاہتے ہيں؟ (مثلاً ₹60,000 کے اندر ليپ ٹاپ)',
    popularCategories: 'مقبول زمرے',
    recentSearches: 'حاليہ تلاش',
    voiceButton: 'پنچائت AI سے بات کريں',
    voiceListening: 'آواز سنی جا رہی ہے...',
    startNegotiation: 'لائیو نيگوشي ايشن شروع کريں',
    liveNegotiation: 'لائیو نيگوشي ايشن سٹريم',
    factBusHeader: 'فيکٹ بس — مشترکہ نيگوشي ايشن ميموری',
    bestDiscoveredOffer: 'بہترين دريافت شدہ افر',
    recommendationHeader: 'نيگوشي ايشن مکمل — تجويز کردہ ڈيل',
    dealScore: 'ڈيل سکور',
    potentialSavings: 'امکانی بچت',
    sellerPortal: 'سلر پورٹل',
    adminDashboard: 'مارکيٹ انٹيلي جنس ڈيش بورڈ',
    disclaimer: 'پنچائت AI نے رابطہ کردہ دکانداروں ميں سے بہترين مقابلہ جاتی افر دريافت کی۔',
    improveOffer: 'افر ميں اضافہ کريں'
  }
};
