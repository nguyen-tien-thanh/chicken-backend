export interface IQuery {
  take: number;
  skip: number;
  where?: Record<string, any>;
  include?: Record<string, boolean | any>;
  orderBy?: Record<string, 'asc' | 'desc'>[];
  select?: Record<string, boolean | any>;
}
