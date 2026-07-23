import { CardProfile } from '../types.js';

export function generateVCardString(card: CardProfile): string {
  const nameParts = card.name.split(' ');
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
  const firstName = nameParts[0] || '';

  const vcardLines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${lastName};${firstName};;;`,
    `FN:${card.name}`,
    `ORG:${card.company}`,
    `TITLE:${card.title}`,
    `EMAIL;TYPE=INTERNET,WORK:${card.email}`,
    `TEL;TYPE=CELL:${card.phone}`,
    card.whatsapp ? `TEL;TYPE=WORK,VOICE:${card.whatsapp}` : '',
    card.website ? `URL:${card.website}` : '',
    card.address ? `ADR;TYPE=WORK:;;${card.address};;;;` : '',
    card.bio ? `NOTE:${card.bio.replace(/\n/g, ' ')}` : '',
    card.socialLinks?.linkedin ? `X-SOCIALPROFILE;TYPE=linkedin:${card.socialLinks.linkedin}` : '',
    card.socialLinks?.twitter ? `X-SOCIALPROFILE;TYPE=twitter:${card.socialLinks.twitter}` : '',
    'END:VCARD'
  ];

  return vcardLines.filter(Boolean).join('\n');
}

export function downloadVCard(card: CardProfile): void {
  const vcardText = generateVCardString(card);
  const blob = new Blob([vcardText], { type: 'text/vcard;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const fileName = `${card.slug || card.name.toLowerCase().replace(/\s+/g, '-')}.vcf`;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
