// Official customer-care phone lines, taken only from each bank's OWN website (the page is in `source`).
// Check them every few months and update `checked`. Never fill one in from a blog, directory or
// social media post: a wrong number could send someone straight to a scammer.
// A bank that isn't listed simply shows no Call button.
export type Contact = {
  phone?: string // digits only, used for the tap-to-call link
  show?: string // the same number, spaced for reading
  source?: string // where it was confirmed
  checked?: string // when it was confirmed
  whatsapp?: string // not used for now: you chose phone only
  email?: string // not used for now: you chose phone only
}

export const DIRECTORY: Record<string, Contact> = {
  Opay: { phone: '07008888328', show: '0700 8888 328', source: 'opayweb.com/contact-us', checked: '2026-11-23' },
  PalmPay: { phone: '02018886888', show: '0201 888 6888', source: 'palmpay.com/company/contact', checked: '2026-11-23' },
  Moniepoint: { phone: '02018889990', show: '0201 888 9990', source: 'support.moniepoint.com (Customer Care channels)', checked: '2026-11-23' },
  Kuda: { phone: '0700022555832', show: '0700 022 555 832', source: 'help.kuda.com (Contact Support)', checked: '2026-11-23' },
  GTBank: { phone: '02014480000', show: '0201 448 0000', source: 'gtbank.com/help-centre/contact-us', checked: '2026-11-23' },
  'Access Bank': { phone: '07003000000', show: '0700 300 0000', source: 'accessbankplc.com/help', checked: '2026-11-23' },
  'Zenith Bank': { phone: '02012787000', show: '0201 278 7000', source: 'zenithbank.com/customer-service', checked: '2026-11-23' },
  UBA: { phone: '02012808822', show: '0201 280 8822', source: 'ubagroup.com/nigeria/help', checked: '2026-11-23' },
  'First Bank': { phone: '07080625000', show: '0708 062 5000', source: 'firstbanknigeria.com/contact/feedback-complaints', checked: '2026-11-23' },
  FCMB: { phone: '07003290000', show: '0700 329 0000', source: 'fcmb.com/customer-service.php', checked: '2026-11-23' },
  'Fidelity Bank': { phone: '070034335489', show: '0700 3433 5489', source: 'fidelitybank.ng/help-support/faqs', checked: '2026-11-23' },
  'Union Bank': { phone: '02012716816', show: '0201 271 6816', source: 'unionbankng.com/support', checked: '2026-11-23' },
  'Sterling Bank': { phone: '07008220000', show: '0700 822 0000', source: 'sterling.ng/complaint', checked: '2026-11-23' },
  'Wema Bank (ALAT)': { phone: '08039003700', show: '0803 900 3700', source: 'wemabank.com/contact-us', checked: '2026-11-23' },
  'Stanbic IBTC': { phone: '07009099099', show: '0700 909 9099', source: 'stanbicibtcbank.com (Contact details)', checked: '2026-11-23' },
  Ecobank: { phone: '07005000000', show: '0700 500 0000', source: 'ecobank.com/ng (Contact us)', checked: '2026-11-23' },
}

export const contactFor = (bank: string): Contact => DIRECTORY[bank] ?? {}