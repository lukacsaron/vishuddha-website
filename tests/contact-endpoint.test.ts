import { describe, expect, it } from 'vitest';
import { POST } from '../src/pages/api/contact';
import { listEnquiries } from '../src/cms/enquiries';

const valid = {
  name: 'Kovács Anna', phone: '+36 20 123 4567', company: 'Teszt Kft.', email: 'anna@teszt.hu',
  service: 'film', message: 'Szia!', consent: 'on', lang: 'hu', website: '',
};

const post = (body: unknown, ip = '10.0.0.1') =>
  (POST as any)({
    request: new Request('http://site.test/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
    clientAddress: ip,
  }) as Promise<Response>;

describe('POST /api/contact', () => {
  it('stores a valid enquiry', async () => {
    const res = await post(valid);
    expect(res.status).toBe(200);
    expect(listEnquiries()[0]).toMatchObject({ name: 'Kovács Anna', service: 'film', lang: 'hu', read: false });
  });

  it('rejects invalid fields and names them, storing nothing', async () => {
    const before = listEnquiries().length;
    const res = await post({ ...valid, email: 'nope', phone: '123' });
    expect(res.status).toBe(400);
    expect((await res.json()).fields.sort()).toEqual(['email', 'phone']);
    expect(listEnquiries()).toHaveLength(before);
  });

  it('rejects a body that is not JSON', async () => {
    expect((await post('name=x')).status).toBe(400);
  });

  it('pretends to accept a submission that fills the honeypot, storing nothing', async () => {
    const before = listEnquiries().length;
    const res = await post({ ...valid, website: 'http://spam.test' });
    expect(res.status).toBe(200);
    expect(listEnquiries()).toHaveLength(before);
  });

  it('limits one address to five enquiries an hour without affecting others', async () => {
    const ip = '10.0.0.99';
    for (let i = 0; i < 5; i++) expect((await post(valid, ip)).status).toBe(200);
    expect((await post(valid, ip)).status).toBe(429);
    expect((await post(valid, '10.0.0.100')).status).toBe(200);
  });

  it('does not count rejected submissions against the limit', async () => {
    const ip = '10.0.0.50';
    for (let i = 0; i < 8; i++) await post({ ...valid, email: 'bad' }, ip);
    expect((await post(valid, ip)).status).toBe(200);
  });
});
