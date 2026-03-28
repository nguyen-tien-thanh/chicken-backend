import { IPaginationResult } from '@/common/interfaces';
import { tryParse } from '@/common/utils';

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
  }: IPaginationResult<T>) {
    this.currentPage = currentPage;
    this.pageSize = pageSize;
    this.totalItems = totalItems;
    this.next = next;
    this.previous = previous;
    this.results = tryParse(results) as T[];
  }
}
