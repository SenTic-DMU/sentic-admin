export interface Notice {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NoticeListResponse {
  content: Notice[];
  totalElements: number;
  totalPages: number;
}

export interface FetchNoticesParams {
  page: number;
}

export interface NoticeInput {
  title: string;
  content: string;
  isPinned: boolean;
}
