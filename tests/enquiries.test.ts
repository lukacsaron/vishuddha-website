import { describe, expect, it } from 'vitest';
import { addEnquiry, deleteEnquiry, enquirySchema, listEnquiries, setRead } from '../src/cms/enquiries';

const valid = {
  name: ' Kovács Anna ', phone: '+36 (20) 123-4567', company: 'Teszt Kft.', email: 'anna@teszt.hu',
  service: 'film', message: 'Szia!', consent: 'on', lang: 'hu',
};

describe('enquiry validation', () => {
  it('accepts a complete submission and trims it', () => {
    const parsed = enquirySchema.parse(valid);
    expect(parsed.name).toBe('Kovács Anna');
  });

  it('allows an empty message and defaults the language', () => {
    const { message, lang, ...rest } = valid;
    expect(enquirySchema.parse(rest)).toMatchObject({ message: '', lang: 'en' });
  });

  it.each([
    ['name', ''],
    ['name', '   '],
    ['phone', '12345'],
    ['email', 'anna@teszt'],
    ['email', 'anna teszt@x.hu'],
    ['service', ''],
    ['consent', undefined],
    ['consent', 'off'],
    ['lang', 'de'],
    ['message', 'x'.repeat(5001)],
  ])('rejects %s = %j', (field, value) => {
    expect(enquirySchema.safeParse({ ...valid, [field]: value }).success).toBe(false);
  });
});

describe('enquiry storage', () => {
  it('stores newest first, without the consent flag, and supports read/delete', () => {
    const first = addEnquiry(enquirySchema.parse(valid));
    const second = addEnquiry(enquirySchema.parse({ ...valid, name: 'Second' }));
    const all = listEnquiries();
    expect(all.map((e) => e.id)).toEqual([second.id, first.id]);
    expect(all[0]).not.toHaveProperty('consent');
    expect(all[0].read).toBe(false);

    expect(setRead(first.id, true)).toBe(true);
    expect(listEnquiries().find((e) => e.id === first.id)!.read).toBe(true);
    expect(setRead('nope', true)).toBe(false);

    expect(deleteEnquiry(second.id)).toBe(true);
    expect(deleteEnquiry(second.id)).toBe(false);
    expect(listEnquiries()).toHaveLength(1);
  });
});
