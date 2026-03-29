import { IQuery, IQueryOne, IQueryWithoutInclude } from '@/common/interfaces';
import { jsonGet } from '@/common/utils';
import {
  BadRequestException,
  ExecutionContext,
  createParamDecorator,
} from '@nestjs/common';
import { DECORATORS } from '@nestjs/swagger/dist/constants';

export const Query = createParamDecorator(
  (
    data: unknown,
    ctx: ExecutionContext,
  ): IQuery | IQueryOne | IQueryWithoutInclude => {
    const request = ctx.switchToHttp().getRequest();
    const getOneRequest = request.params.id ? true : false;

    const query: IQuery = {
      take:
        jsonGet(request.query, 'take') == -1 // -1 means all
          ? undefined
          : jsonGet(request.query, 'take', getOneRequest ? undefined : 10),
      skip: jsonGet(request.query, 'skip'),
      where: jsonGet(request.query, 'where', {}),
      include: jsonGet(request.query, 'include', {}),
      orderBy: jsonGet(request.query, 'orderBy', []),
      select: jsonGet(request.query, 'select', {}),
    };

    Object.keys(query).forEach((key) => {
      if (
        query[key] === undefined ||
        (Array.isArray(query[key]) && query[key].length === 0) ||
        (typeof query[key] === 'object' && Object.keys(query[key]).length === 0)
      ) {
        delete query[key];
      }
    });

    if (query.include && query.select) {
      throw new BadRequestException(
        'Include and select cannot be used together',
      );
    }

    if (
      getOneRequest &&
      (query.take || query.skip || query.orderBy || query.where)
    ) {
      throw new BadRequestException(
        'This endpoint only support include and select',
      );
    }

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
            name: 'query',
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
