// @ts-nocheck
import { normalizeArticleListResponse } from '@/lib/admin/types';

describe('normalizeArticleListResponse', () => {
  it('processes list-articles payload with DynamoDB metadata fields', () => {
    const payload = {
      items: [
        {
          status: 'DRAFT',
          meta: { version: 1 },
          entityType: 'ARTICLE',
          id: '046be6f6-7f51-4f83-a600-6cfebace9e5e',
          updatedAt: '2026-02-27T15:28:34Z',
          sk: '046be6f6-7f51-4f83-a600-6cfebace9e5e',
          generated: {},
          createdAt: '2026-02-27T15:28:34Z',
          tags: [],
          title: 'retrieve-test',
          pk: 'ARTICLE'
        },
        {
          status: 'DRAFT',
          sk: '3a4f33bc-7e0d-4d1a-a2d5-c1cc3981064a',
          entityType: 'ARTICLE',
          createdAt: '2026-02-27T15:26:29Z',
          id: '3a4f33bc-7e0d-4d1a-a2d5-c1cc3981064a',
          generated: {},
          tags: [],
          title: 'ui-test',
          updatedAt: '2026-02-27T15:26:29Z',
          pk: 'ARTICLE'
        },
        {
          status: 'DRAFT',
          createdAt: '2026-02-27T14:58:23Z',
          entityType: 'ARTICLE',
          generated: {},
          sk: '01adbeb6-b424-4d43-8bc8-0823d68e1b43',
          tags: [],
          title: 'Test',
          sourceInputs: ['Test'],
          pk: 'ARTICLE',
          updatedAt: '2026-02-27T14:58:23Z',
          id: '01adbeb6-b424-4d43-8bc8-0823d68e1b43'
        }
      ]
    };

    const result = normalizeArticleListResponse(payload);

    expect(result.items).toHaveLength(3);
    expect(result.items.map((item) => item.title)).toEqual(['retrieve-test', 'ui-test', 'Test']);
    expect(result.items[2].sourceInputs).toEqual(['Test']);
  });

  it('handles raw array payload and uses sk as fallback id', () => {
    const result = normalizeArticleListResponse([
      {
        sk: 'fallback-id',
        title: 'Fallback',
        status: 'UNKNOWN'
      }
    ]);

    expect(result.items).toEqual([
      {
        id: 'fallback-id',
        title: 'Fallback',
        status: 'DRAFT',
        sourceInputs: undefined,
        tags: undefined,
        updatedAt: undefined,
        createdAt: undefined,
        generated: undefined,
        publishedAt: undefined,
        publishedUrl: undefined
      }
    ]);
  });
});
