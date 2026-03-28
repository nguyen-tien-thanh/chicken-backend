export interface PaginationResultInterface<T> {
  results: T[];
  currentPage: number;
  pageSize: number;
  totalItems: number;
  next?: number;
  previous?: number;
}
