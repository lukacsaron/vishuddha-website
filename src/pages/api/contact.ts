import type { APIRoute } from 'astro';
import { addEnquiry, contactLimiter, enquirySchema } from '../../cms/enquiries';
import { notify } from '../../cms/mail';
import { getContent } from '../../cms/store';
import { json } from '../../cms/http';
import { clientIp } from '../../cms/visitor-ip';

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const ip = clientIp(request, clientAddress);
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid request' }, 400);
  }

  // Bots fill every field; people never see this one. Answer as if it worked.
  if (typeof body.website === 'string' && body.website.trim()) return json({ ok: true });

  if (!contactLimiter.allowed(ip)) return json({ error: 'Too many requests' }, 429);

  const parsed = enquirySchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: 'Invalid fields', fields: parsed.error.issues.map((i) => i.path.join('.')) }, 400);
  }

  contactLimiter.hit(ip);
  const enquiry = addEnquiry(parsed.data);

  const content = getContent();
  const option = content.form.options.find((o) => o.value === enquiry.service);
  // The enquiry is already stored; a mail failure must not turn into an error for the visitor
  notify(enquiry, option?.label.en ?? enquiry.service, content.contact.email)
    .catch((err) => console.error('[contact] notification email failed:', err));

  return json({ ok: true });
};
