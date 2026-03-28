import { PaginationResultInterface, safeJson } from '@/common';

export class Pagination<T> {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  next?: number;
  previous?: number;
  results: T[];

  constructor({
    results,
    currentPage,
    pageSize,
    totalItems,
    next,
    previous,
  }: PaginationResultInterface<T>) {
    this.currentPage = currentPage;
    this.pageSize = pageSize;
    this.totalItems = totalItems;
    this.next = next;
    this.previous = previous;
    this.results = safeJson(results) as T[];
  }
}
