export interface ColorVariant {
  name: string;
  hex: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  price: number;
  priceFormatted: string;
  subtitle: string;
  category: 'women' | 'men' | 'bags' | 'shoes' | 'accessories';
  subcategory:
    | 'Dress & Setelan'
    | 'Outerwear Atelier'
    | 'Celana Tailored'
    | 'Knitwear'
    | 'Tas Kurasi'
    | 'Sepatu'
    | 'Aksesori';
  bestsellerTab?: 'Outerwear' | 'Celana' | 'Dress' | 'Sepatu' | 'Tas';
  image: string;
  gallery: string[];
  alt: string;
  badges: { text: string; variant: 'primary' | 'secondary' | 'surface' }[];
  fitNote: string;
  fabricType: 'Linen Organik' | 'Sutra Mulberry' | 'Kasmir Murni' | 'Kulit Calfskin' | 'Cotton Twill';
  colors: ColorVariant[];
  sizes: string[];
  defaultSize: string;
  disabledSizes?: string[];
  inStock: boolean;
  stockLabel?: string;
  description: string;
  fabricDetails: string[];
  careInstructions: string[];
  modelInfo: string;
  fitScale: 'Slim Fit' | 'Pas Banget' | 'Relaxed';
}

export const PRODUCT_CATEGORIES: { value: Product['category']; label: string }[] = [
  { value: 'women', label: 'Wanita' },
  { value: 'men', label: 'Pria' },
  { value: 'bags', label: 'Tas' },
  { value: 'shoes', label: 'Sepatu' },
  { value: 'accessories', label: 'Aksesori' },
];

export const PRODUCT_SUBCATEGORIES: Product['subcategory'][] = [
  'Dress & Setelan',
  'Outerwear Atelier',
  'Celana Tailored',
  'Knitwear',
  'Tas Kurasi',
  'Sepatu',
  'Aksesori',
];

export const PRODUCT_FABRICS: Product['fabricType'][] = [
  'Linen Organik',
  'Sutra Mulberry',
  'Kasmir Murni',
  'Kulit Calfskin',
  'Cotton Twill',
];

export const PRODUCT_FIT_SCALES: Product['fitScale'][] = ['Slim Fit', 'Pas Banget', 'Relaxed'];

export const PRODUCT_BESTSELLER_TABS: NonNullable<Product['bestsellerTab']>[] = [
  'Outerwear',
  'Celana',
  'Dress',
  'Tas',
  'Sepatu',
];

export const BRAND_ASSETS = {
  logo: 'https://lh3.googleusercontent.com/aida/ALJJyrBt5s65uqwk6n29eOl52urUKklI0O-DGI7A8G7PQ942xDTftriArdNBuQVDvAtSXeaJb15a0javsL716txQv_ZTAvLyz8EpBLRTeVJDt_XtkU1lH2dpK0Gkd4nF8NvQ7-6wHxbkw7gPnARHyXu-vQ2nRcZhnph-2He4S_khPvLhSv1vvj_SMp6WMdA7w6m-VbXeuu6cjF6EXMW1EAkBJnujyuDisOb14LvMXrkK6ite3w',
  avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB7rJTmJf41qRBRCovdyIHQbBvjZywgrylnOl3AROoVPjz1E3_txlARVNSeoFqwFqygIYDVwKJ8-3APFkYNlnLCsqPJtnnpdxDXDU92NMaAYeW5pzhjyEPGJoP-d9C-oCh3Lqs9z5LIgrooLUj-1FtA-SCuNI5tHZSHwbPEVl2R8oEjt02BmJs542-qowTLHSDz36INWgYujZrQBGPI8D7IHJFxjkA3IkGC-xt7aeMZ',
  heroLineup: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDOJdcuPf31_mf3_jx3msrdAVDxIxe_T47pbDEjrI3ej156MgfAAeJITc6Rq4s071p1jYf0aU9m2MMySXyjubSJoXrS6qIBPCJ3KdvmhsatewditQt1Lp-dhrFlXsNrFpYXBgQSE5jbmXLDUvRxUU6yGkfSl-2dF93QouadYnT3q_zySZk9Hlzkap2aQOyoO7IMy8V-9Oho8ddGAP75HUmmaJdiio8AQapiNgrGnL8U',
  leatherBanner: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB_6VwvsXVQVaiDYbpRPxck-liQri5GZIEVI03NdvsC2CwAOdYlqEfUw5sOy-35TQNq-0VXFH3A42ZG3-b-fd6KI0SO2DoVFzCWmKU0Qz4k2Lcb6wNnH-wqB8J5zEzhQzjoeLA_ARAg4fbTKNdhnCIj2xWdzmBYOFaXFa_PJT8pDwVxzwidJFebgmwbbr-FHb5d2a3eV6_FpgDYwFD8MrusZja2CkpP4YMFKizWHcRx',
  editorialCraft: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDMZx44lLK8_SjgYTLNCT-sUJ75-0-Uh17o_oQ4AHW3-lWVzFvdE8P_zhwqrOd16tPJSEPnrTpu3dDvi-M0be8GcuESknRbUCVKeOB_StSRce_7xpPOiKj8iOxwtMA1FeipZq2Uoi-C-dPXEVilAZUh3qioOIdUE5JIl5kotKOa5YAKNV-6wYzbalEVZxqOoMKJG52KjqZR9f0hB1ryg82BI6AaRZ9nyULPn-26PWGJ',
};

export const CATEGORY_PORTAL_META = [
  {
    id: 'men',
    label: 'Pria',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCSZfgkDnK-rrgefOYy46n4Lev9UNuxpkdiSxAvtXMNVrzTXPBDjuIk_I4KsnbY2YYtat9fq7TjHXQug1En2RckvrPXl4fNCt4DOIsnSvxmXyTvlGehRYfvo5a2DlIxGis4x8qX9_ihFGUuRpzTMJsRkmFqFHrD5ef4Y3oSzkqwpCRipgvQ5x7zEDzIoXzCQ-KnOTofKCuSZ2RoQY58GUG0rkA9BhjII_98LY2FCj_-',
    alt: 'Minimalist men fashion portrait wearing a tailored taupe blazer and clean off-white linen tee',
  },
  {
    id: 'women',
    label: 'Wanita',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBvhEF-uIUQXF7sLsOPGzStAUST75dGEzGfjlSEH3u44Dcd5WG6TiCazxIp3Tl7FznkXmuGZPuIdNmMjJIiiE_jHwHRLoAAK6vaqpfwsF57y-ltHhiviKPVVdUeeUjuHsHoFcUJQAFQrSofGpg5D1vULhxMPgpDyZDaBo_9_uzXuPZrRX8aUCFvRtxAk2HgzD_Y6h-l9Ok3ZDy_1mcN5wWxqZkX03rCRUk5UZ_1SbNG',
    alt: 'Editorial portrait of female model in ivory sleeveless column dress with natural wavy hair',
  },
  {
    id: 'bags',
    label: 'Tas',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAOLJA9_ICTGd7fNmHUBgL_FpeiBf1BSJFv05qLNT4RkHyYLUaDqGU0JzKOKiPwQMggnDjknXccJidVqO0p8oskSEOWM9FKG7CkpEvPx7kkp0MgUWD8RdxmrcVXNxNSVadZrY7m6qNl3bO5GGnjIWghk-wwY0Gz1qRdo4uhDcEI6oBf19uS8sbxoCDOig8L4K8DBJP8ZoOPSbNWzndSB5lT0xQShzmARtF_KlIh8Yx3',
    alt: 'Structured taupe pebbled grain leather tote handbag on travertine stone pedestal',
  },
  {
    id: 'shoes',
    label: 'Sepatu',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDOKXR5syeSPYtP93udfBrsLIGxEusJiUzdIdrivrO3UVnvjcpXK0lrstEVqcKFFp6MDqPlvWXLlsy6ZYcCAILLntCwPhQotyXKQJT0pme4-G-SwdYBP5NFht91gISvVI9rgZ85YeD_gTzjuBvRB34Zz9BQ5VFpTJ1xGLJobRbfgaImNSgdkLfUK8qpFO7ugGGQKYhuTKggu0YvxmiHgVOJIHPECtfupKig08a611s9',
    alt: 'Pair of hand-burnished tan leather penny loafers resting on warm sandstone architectural slab',
  },
  {
    id: 'accessories',
    label: 'Aksesori',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAfr27J7yq40VBfz-srl7RMf8IncNlm3hUTuQHm41Lue53_2tA1C4R27A15siAnbb6xFN29BgMGB3DEbrApl2pU-0knJW-__Xenh4yZw3EAOVDP4oEG9eo9Vwkibks9L_c8eAHi2l47Z3BWc2omIJwPjgG7zCtYqaBZtJpBpt5speKKWPdAM-R6OcCqU3fWBVoERRSX5s_Lm6SmiRE0z38oKhgOiOT86_Gj2QwlELy9',
    alt: 'Luxury minimalist chronograph watch with black dial and taupe saddle leather strap',
  },
] as const;

// Produk real dikelola langsung oleh Admin di Supabase (tidak ada data dummy lokal)
export const PRODUCTS: Product[] = [];

export const CATEGORY_PORTALS = CATEGORY_PORTAL_META.map((portal) => ({
  ...portal,
  count: '0 Kurasi',
}));
