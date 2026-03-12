export interface ICourse {
  id: string;
  title: string;
  description: string;
  imageUrl?: string | null;
  imagePublicId?: string | null;
  category: 'Featured' | 'ScholarX';
  currentPrice: number;
  oldPrice?: number | null;
  instructorId?: string | null;
  status: 'active' | 'inactive';
  totalDuration: number;
  totalLessons: number;
  subscriberCount: number;
  lastSyncedAt: Date | string;
  requiresForm: boolean;
  salesInquiry: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  isSubscribed?: boolean;
}

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalCourses: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedCoursesResponse {
  items: ICourse[];
  pagination: PaginationMeta;
}
