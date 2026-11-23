// Storefront API types (kept in this project; not shared with backend/admin).

export type Lang = 'bn' | 'en';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface CardVariant {
  id: number;
  name: string;
  nameBn?: string | null;
  regularPrice: number;
  salePrice: number | null;
  price: number;
  stock: number;
  isDefault: boolean;
}

export interface ProductCard {
  id: number;
  name: string;
  nameBn?: string | null;
  slug: string;
  image: string | null;
  hoverImage: string | null;
  regularPrice: number;
  price: number;
  discountPercent: number;
  inStock: boolean;
  stock: number;
  unit?: string | null;
  hasVariants: boolean;
  variants: CardVariant[];
  avgRating: number;
  reviewCount: number;
  badges: { featured: boolean; bestSeller: boolean; newArrival: boolean; combo: boolean };
}

export interface Crumb {
  id: number;
  name: string;
  nameBn?: string | null;
  slug: string;
}

export interface ProductDetail {
  id: number;
  name: string;
  nameBn?: string | null;
  slug: string;
  sku?: string | null;
  shortDescription?: string | null;
  description?: string | null;
  regularPrice: number;
  salePrice: number | null;
  price: number;
  discountPercent: number;
  stock: number;
  inStock: boolean;
  unit?: string | null;
  hasVariants: boolean;
  avgRating: number;
  reviewCount: number;
  soldCount: number;
  isCombo: boolean;
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeywords?: string | null;
  brand?: { id: number; name: string; slug: string; logo?: string | null } | null;
  category?: Crumb | null;
  breadcrumb: Crumb[];
  images: { id: number; url: string; alt?: string | null }[];
  variants: (CardVariant & { sku?: string | null; inStock: boolean; weightGrams?: number | null })[];
}

export interface Category {
  id: number;
  parentId: number | null;
  name: string;
  nameBn?: string | null;
  slug: string;
  description?: string | null;
  image?: string | null;
  isFeatured: boolean;
  metaTitle?: string | null;
  metaDescription?: string | null;
  children: Category[];
  childCount?: number;
  breadcrumb?: Crumb[];
}

export interface Brand {
  id: number;
  name: string;
  slug: string;
  logo?: string | null;
}

export interface Banner {
  id: number;
  title: string;
  subtitle?: string | null;
  image: string;
  mobileImage?: string | null;
  link?: string | null;
  buttonText?: string | null;
  position: 'hero' | 'hero_side' | 'offer' | 'wide' | 'category' | 'popup';
}

export interface Testimonial {
  id: number;
  name: string;
  rating: number;
  comment: string;
  createdAt: string;
  product: { name: string; slug: string };
}

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt?: string | null;
  content?: string | null;
  coverImage?: string | null;
  tags?: string[];
  publishedAt: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
  author?: { id: number; name: string } | null;
  related?: BlogPost[];
}

export interface StaticPage {
  id: number;
  title: string;
  slug: string;
  content?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  updatedAt: string;
}

export interface CategorySection {
  category: Category;
  products: ProductCard[];
}

export interface HomeData {
  heroBanners: Banner[];
  heroSideBanner: Banner | null;
  offerBanners: Banner[];
  wideBanners: Banner[];
  popupBanner: Banner | null;
  categories: Category[];
  bestSellers: ProductCard[];
  categorySections: CategorySection[];
  newArrivals: ProductCard[];
  allProducts: { products: ProductCard[]; total: number };
}

export type Settings = Record<string, unknown> & {
  site_name?: string;
  site_tagline?: string;
  site_tagline_bn?: string;
  logo?: string;
  phone?: string;
  hotline?: string;
  email?: string;
  address?: string;
  address_bn?: string;
  business_hours?: string;
  whatsapp?: string;
  messenger?: string;
  facebook?: string;
  instagram?: string;
  youtube?: string;
  tiktok?: string;
  cod_enabled?: boolean;
  bkash_enabled?: boolean;
  sslcommerz_enabled?: boolean;
  guest_checkout_enabled?: boolean;
  min_order_amount?: number;
  meta_title?: string;
  meta_description?: string;
  og_image?: string;
  facebook_pixel_id?: string;
  ga4_measurement_id?: string;
  logo_dark?: string;
  consultation_url?: string;
  payment_banner?: string;
};

export interface DeliveryZone {
  id: number;
  name: string;
  nameBn?: string | null;
  slug: string;
  charge: number;
  freeDeliveryThreshold: number | null;
  estimatedDays?: string | null;
}

export interface CartLine {
  id: number;
  productId: number;
  variantId: number | null;
  name: string;
  nameBn?: string | null;
  slug: string | null;
  variantName?: string | null;
  variantNameBn?: string | null;
  image: string | null;
  unitPrice: number;
  regularPrice: number;
  quantity: number;
  lineTotal: number;
  stock: number;
  issue: null | 'unavailable' | 'out_of_stock' | 'insufficient_stock';
}

export interface Cart {
  sessionId: string | null;
  items: CartLine[];
  itemCount: number;
  subtotal: number;
  hasIssues: boolean;
}

export interface Review {
  id: number;
  name: string;
  rating: number;
  title?: string | null;
  comment?: string | null;
  isVerifiedPurchase: boolean;
  adminReply?: string | null;
  createdAt: string;
}

export interface ReviewSummary {
  avgRating: number;
  reviewCount: number;
  breakdown: Record<1 | 2 | 3 | 4 | 5, number>;
}

export interface User {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  gender?: 'male' | 'female' | 'other' | null;
  dateOfBirth?: string | null;
  phoneVerifiedAt?: string | null;
}

export interface Address {
  id: number;
  label?: string | null;
  fullName: string;
  phone: string;
  addressLine: string;
  area?: string | null;
  city?: string | null;
  district?: string | null;
  postalCode?: string | null;
  deliveryZoneId?: number | null;
  isDefault: boolean;
}

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
export type PaymentMethod = 'cod' | 'bkash' | 'sslcommerz';

export interface Order {
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: 'unpaid' | 'pending' | 'paid' | 'failed' | 'refunded';
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  shippingAddress: string;
  shippingArea?: string | null;
  shippingCity?: string | null;
  shippingDistrict?: string | null;
  deliveryZoneName?: string | null;
  couponCode?: string | null;
  subtotal: number;
  discount: number;
  deliveryCharge: number;
  total: number;
  customerNote?: string | null;
  courierName?: string | null;
  trackingCode?: string | null;
  statusHistory: { status: OrderStatus; note?: string; at: string }[];
  items: { productId: number | null; variantId: number | null; productName: string; variantName?: string | null; image?: string | null; unitPrice: number; quantity: number; total: number }[];
  canCancel: boolean;
  createdAt: string;
}

export interface Quote {
  lines: { productId: number; variantId: number | null; productName: string; variantName: string | null; unitPrice: number; quantity: number; total: number }[];
  subtotal: number;
  discount: number;
  deliveryCharge: number;
  total: number;
  coupon: { code: string; description?: string | null; discount: number } | null;
  couponError: string | null;
}

// ─── Landing pages (admin → Marketing → Landing pages) ───
export type LandingBackground = 'white' | 'tinted' | 'dark';
export type LandingSection = { id: string; background?: LandingBackground } & (
  | { type: 'hero'; heading: string; subheading?: string | null; image?: string | null; buttonText?: string | null }
  | { type: 'text'; heading?: string | null; body?: string | null }
  | { type: 'image'; image: string; caption?: string | null }
  | { type: 'video'; heading?: string | null; url: string }
  | { type: 'features'; heading?: string | null; items: string[] }
  | { type: 'gallery'; heading?: string | null; images: string[] }
  | { type: 'faq'; heading?: string | null; items: { q: string; a: string }[] }
  | { type: 'cta'; heading?: string | null; text?: string | null; buttonText?: string | null }
  | { type: 'orderForm' }
);
export interface LandingProduct { productId: number; variantId: number | null; quantity: number; product: ProductCard }
export interface LandingOptions {
  primaryColor?: string | null;
  orderFormTitle?: string | null;
  orderButtonText?: string | null;
  hotline?: string | null;
  showSiteHeader?: boolean;
  multiSelect?: boolean;
  notice?: string | null;
}
export interface LandingPage {
  id: number;
  title: string;
  slug: string;
  products: LandingProduct[];
  sections: LandingSection[];
  options: LandingOptions | null;
  metaTitle: string | null;
  metaDescription: string | null;
  ogImage: string | null;
  updatedAt: string;
}
