import { IQuery } from '@/common/interfaces';
import { jsonGet } from '@/common/utils';
import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { DECORATORS } from '@nestjs/swagger/dist/constants';

export type IQueryWithoutInclude = Omit<IQuery, 'include'>;

export const Filter = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): IQuery => {
    const request = ctx.switchToHttp().getRequest();

    const query: IQuery = {
      skip: jsonGet(request.query, 'skip'),
      where: jsonGet(request.query, 'where') ?? {},
      include: jsonGet(request.query, 'include') ?? {},
      orderBy: jsonGet(request.query, 'orderBy') ?? [],
      select: jsonGet(request.query, 'select') ?? {},
    };

    return query;
  },
  [
    (target: any, key: string | symbol | undefined) => {
      if (!key) return;

      const existing =
        Reflect.getMetadata(DECORATORS.API_PARAMETERS, target[key]) ?? [];
      const example = `{
  "where": { "field": "value" },
  "take": 10,
  "skip": 0,
  "include": { "field": true },
  "orderBy": { "field": "asc" },
  "select": { "field": "value" }
}`;

      Reflect.defineMetadata(
        DECORATORS.API_PARAMETERS,
        [
          ...existing,
          {
            in: 'query',
            name: 'filter',
            required: false,
            type: 'object',
            example,
          },
        ],
        target[key],
      );
    },
  ],
);
