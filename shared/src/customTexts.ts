export type CustomTextContentType = "text" | "code";

export interface CustomText {
  id: number;
  userId: number;
  title: string;
  content: string;
  contentType: CustomTextContentType;
  language: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomTextRequest {
  title: string;
  content: string;
  contentType: CustomTextContentType;
  language: string;
  isPublic?: boolean;
}

export interface UpdateCustomTextRequest {
  title?: string;
  content?: string;
  contentType?: CustomTextContentType;
  language?: string;
  isPublic?: boolean;
}

export interface CustomTextsQuery {
  contentType?: CustomTextContentType;
  language?: string;
  search?: string;
  page?: number;
  limit?: number;
}
