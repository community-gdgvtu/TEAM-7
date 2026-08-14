import type { Language, ProductCategory } from '../types';

export interface SamplePrompt {
  id: string;
  title: string;
  category: ProductCategory;
  language: Language;
  text: string;
  translation: string;
  extracted: {
    product: string;
    brand: string;
    budget: number;
    quantity: string;
    location: string;
    preferences: string[];
  };
}

export const SAMPLE_PROMPTS: SamplePrompt[] = [
  {
    id: 'p-laptop',
    title: 'Coding Laptop under ₹60,000',
    category: 'Computers',
    language: 'en',
    text: 'I need a laptop for coding under ₹60,000 in Hulkoti / Gadag.',
    translation: 'English Direct Query',
    extracted: {
      product: 'Coding Laptop (16GB RAM / Core i5 / SSD)',
      brand: 'ASUS / Lenovo / HP',
      budget: 60000,
      quantity: '1 Unit',
      location: 'Hulkoti Market / Gadag',
      preferences: ['Min 16GB RAM', 'Full Brand Warranty', 'In-stock local pickup']
    }
  },
  {
    id: 'p-samsung',
    title: 'Samsung Phone under ₹18,000 (Hindi)',
    category: 'Electronics',
    language: 'hi',
    text: 'Bhai, ₹18,000 ke andar Samsung Galaxy phone mil sakta hai kya local dukan pe?',
    translation: 'Brother, can I get a Samsung Galaxy phone under ₹18,000 at a local shop?',
    extracted: {
      product: 'Samsung Galaxy Smartphone (5G)',
      brand: 'Samsung',
      budget: 18000,
      quantity: '1 Unit',
      location: 'Hulkoti Market',
      preferences: ['5G Supported', 'Official Samsung Warranty', 'Screen guard included']
    }
  },
  {
    id: 'p-rice',
    title: '5kg Rice under ₹400 (Kannada)',
    category: 'Groceries',
    language: 'kn',
    text: 'ನನಗೆ ₹400 ಒಳಗೆ 5 ಕೆಜಿ ಸೋನಾ ಮಸೂರಿ ಅಕ್ಕಿ ಚೀಲ ಬೇಕು.',
    translation: 'I need a 5kg Sona Masoori rice bag under ₹400.',
    extracted: {
      product: 'Sona Masoori Rice Bag',
      brand: 'Premium Steam Rice',
      budget: 400,
      quantity: '5 kg',
      location: 'Hulkoti Main Bazar',
      preferences: ['Sealed packaging', 'Fresh stock', 'Home delivery preferred']
    }
  },
  {
    id: 'p-sony-ja',
    title: 'Sony Headphones under ₹9,000 (Japanese)',
    category: 'Electronics',
    language: 'ja',
    text: 'ソニーのノイズキャンセリングヘッドホンを₹9,000以下で探しています。',
    translation: 'Looking for Sony noise-canceling headphones under ₹9,000.',
    extracted: {
      product: 'Sony Wireless Headphones',
      brand: 'Sony',
      budget: 9000,
      quantity: '1 Unit',
      location: 'Hulkoti Electronics Plaza',
      preferences: ['Active Noise Cancellation', 'Official Sony Warranty', 'Quick Charge']
    }
  },
  {
    id: 'p-drill',
    title: '500W Drill Machine under ₹2,500 (Urdu)',
    category: 'Hardware',
    language: 'ur',
    text: 'Mujhe ghar ke kaam ke liye 500W drill machine 2500 rupay tak chahiye.',
    translation: 'I need a 500W drill machine for home use up to ₹2,500.',
    extracted: {
      product: 'Impact Drill Machine 500W',
      brand: 'Bosch / Standalone',
      budget: 2500,
      quantity: '1 Unit',
      location: 'Hulkoti Industrial Area',
      preferences: ['Includes drill bit set', 'Manufacturer Warranty', 'Original Box']
    }
  },
  {
    id: 'p-clothes',
    title: 'Cotton Shirts under ₹1,500',
    category: 'Clothing',
    language: 'en',
    text: 'Looking for 2 pure cotton formal shirts under ₹1,500 near market street.',
    translation: 'English Query',
    extracted: {
      product: 'Pure Cotton Formal Shirts',
      brand: 'Raymond / Local Silk Store',
      budget: 1500,
      quantity: '2 Shirts',
      location: 'Hulkoti Market',
      preferences: ['Color fastness guarantee', 'Exchange facility available']
    }
  }
];
