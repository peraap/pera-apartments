export interface Apartment {
  id: string;
  name: string;
  description: string;
  shortDescription: string;
  pricePerNight: number;
  originalPrice?: number;
  capacity: number;
  rooms: number;
  bathrooms: number;
  amenities: string[];
  images: string[];
  location: string;
  slug: string;
  bookingUrl: string;
  metaTitle?: string;
  metaDescription?: string;
}

export interface Booking {
  id: string;
  apartmentId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
}

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  image: string;
  author: string;
  date: string;
  slug: string;
  metaTitle?: string;
  metaDescription?: string;
}

export interface Testimonial {
  id: string;
  name: string;
  rating: number;
  comment: string;
  date: string;
}

export interface SiteSettings {
  brandColor: string;
  contactEmail: string;
  contactPhone: string;
  instagramUrl: string;
  facebookUrl: string;
}
