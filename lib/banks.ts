// Banks and wallets people send money from or to. Grouped so the dropdown is easier to scan.
// Check against the CBN's list of licensed institutions (cbn.gov.ng) every few months:
// banks merge, rename and lose licences. Old cases keep whatever name was saved.

export const BANK_GROUPS: { label: string; banks: string[] }[] = [
  {
    label: 'Wallets & digital banks',
    banks: [
      'Opay', 'PalmPay', 'Moniepoint', 'Kuda', 'FairMoney', 'Carbon', 'VFD (VBank)',
      'Paga', 'Rubies', 'Sparkle', 'Raven Bank',
    ],
  },
  {
    label: 'Commercial banks',
    banks: [
      'Access Bank', 'Alpha Morgan Bank', 'Citibank', 'Ecobank', 'Fidelity Bank', 'First Bank',
      'FCMB', 'Globus Bank', 'GTBank', 'Keystone Bank', 'Optimus Bank', 'Parallex Bank',
      'Polaris Bank', 'Premium Trust Bank', 'ProvidusUnity Bank', 'Signature Bank',
      'Stanbic IBTC', 'Standard Chartered', 'Sterling Bank', 'SunTrust Bank', 'UBA',
      'Union Bank', 'Wema Bank (ALAT)', 'Zenith Bank',
    ],
  },
  {
    label: 'Non-interest banks',
    banks: ['Jaiz Bank', 'Lotus Bank', 'TAJBank', 'The Alternative Bank'],
  },
  {
    label: 'Mobile money (PSBs)',
    banks: ['MTN MoMo PSB', 'Airtel SmartCash PSB', '9PSB', 'Hope PSB'],
  },
  {
    label: 'Microfinance banks',
    banks: ['LAPO MFB', 'AB Microfinance Bank', 'Accion MFB', 'Renmoney MFB'],
  },
  {
    label: 'Merchant banks',
    banks: [
      'Coronation Merchant Bank', 'FBNQuest Merchant Bank', 'FSDH Merchant Bank',
      'Greenwich Merchant Bank', 'Nova Bank', 'Rand Merchant Bank',
    ],
  },
]
// Flat list, for anything that just needs every name
export const BANKS = BANK_GROUPS.flatMap((g) => g.banks)
// Shown as quick tiles at the top of the bank picker
export const POPULAR_BANKS = ['Opay', 'Moniepoint', 'PalmPay', 'Kuda', 'GTBank', 'Access Bank', 'Zenith Bank', 'UBA']

// Short name for a tile, e.g. "Access Bank" → "Access"
export const shortBank = (b: string) => b.replace(/ Bank$/, '').replace(/ \(.*\)$/, '')
// Wallets, digital banks and mobile money have few or no branches, so people call support instead
const NO_BRANCHES = new Set(
  BANK_GROUPS.filter((g) => g.label.startsWith('Wallets') || g.label.startsWith('Mobile money')).flatMap((g) => g.banks)
)
export const isWallet = (bank: string) => NO_BRANCHES.has(bank)