// One-time script: downloads bank and wallet logos into public/banks
// and writes lib/bankLogos.ts so the app knows which ones it has.
// Logos come from github.com/ichtrojan/nigerian-banks (MIT licence).
// Run from the project folder:   node scripts/bank-logos.mjs
import fs from 'node:fs'
import path from 'node:path'

const SOURCE = 'https://raw.githubusercontent.com/ichtrojan/nigerian-banks/master'

// The name used in TraceNaira (lib/banks.ts) → that bank's logo file in the source.
// Not listed, so they keep the letter tile: Opay, Raven Bank, ProvidusUnity Bank,
// LAPO MFB, AB Microfinance Bank, Renmoney MFB, FBNQuest Merchant Bank.
// To add one yourself: put a square PNG in public/banks/ and add a line below.
const LOGOS = [
    ["Opay", "opay"]
  ["PalmPay", "palmpay"],
  ["Moniepoint", "moniepoint-mfb-ng"],
  ["Kuda", "kuda-bank"],
  ["FairMoney", "fairmoney-microfinance-bank"],
  ["Carbon", "carbon"],
  ["VFD (VBank)", "vfd"],
  ["Paga", "paga"],
  ["Rubies", "rubies-mfb"],
  ["Sparkle", "sparkle-microfinance-bank"],
  ["Access Bank", "access-bank"],
  ["Alpha Morgan Bank", "alpha-morgan-bank"],
  ["Citibank", "citibank-nigeria"],
  ["Ecobank", "ecobank-nigeria"],
  ["Fidelity Bank", "fidelity-bank"],
  ["First Bank", "first-bank-of-nigeria"],
  ["FCMB", "first-city-monument-bank"],
  ["Globus Bank", "globus-bank"],
  ["GTBank", "guaranty-trust-bank"],
  ["Keystone Bank", "keystone-bank"],
  ["Optimus Bank", "optimus-bank-limited"],
  ["Parallex Bank", "parallex-bank"],
  ["Polaris Bank", "polaris-bank"],
  ["Premium Trust Bank", "premiumtrust-bank"],
  ["Signature Bank", "signature-bank-ltd"],
  ["Stanbic IBTC", "stanbic-ibtc-bank"],
  ["Standard Chartered", "standard-chartered-bank"],
  ["Sterling Bank", "sterling-bank"],
  ["SunTrust Bank", "suntrust-bank"],
  ["UBA", "united-bank-for-africa"],
  ["Union Bank", "union-bank-of-nigeria"],
  ["Wema Bank (ALAT)", "wema-bank"],
  ["Zenith Bank", "zenith-bank"],
  ["Jaiz Bank", "jaiz-bank"],
  ["Lotus Bank", "lotus-bank"],
  ["TAJBank", "taj-bank"],
  ["The Alternative Bank", "alternative-bank"],
  ["MTN MoMo PSB", "mtn-momo-psb"],
  ["Airtel SmartCash PSB", "airtel-smartcash-psb"],
  ["9PSB", "9mobile-9payment-service-bank"],
  ["Hope PSB", "hopepsb"],
  ["Accion MFB", "accion-microfinance-bank"],
  ["Coronation Merchant Bank", "coronation-merchant-bank"],
  ["FSDH Merchant Bank", "fsdh-merchant-bank-limited"],
  ["Greenwich Merchant Bank", "greenwich-merchant-bank"],
  ["Nova Bank", "nova-bank"],
  ["Rand Merchant Bank", "rand-merchant-bank"],
]

const dir = path.join('public', 'banks')
fs.mkdirSync(dir, { recursive: true })

const got = []
for (const [name, slug] of LOGOS) {
  const file = path.join(dir, `${slug}.png`)
  if (!fs.existsSync(file)) {
    try {
      const res = await fetch(`${SOURCE}/logos/${slug}.png`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()))
    } catch (e) {
      console.log(`Skipped ${name}: ${e.message}`)
      continue
    }
  }
  got.push([name, `/banks/${slug}.png`])
}

// Their licence asks for this notice to travel with the files
try {
  const res = await fetch(`${SOURCE}/LICENSE`)
  if (res.ok) fs.writeFileSync(path.join(dir, 'LICENSE.txt'), await res.text())
} catch {}

const ts =
  '// Made by scripts/bank-logos.mjs. Bank name → logo in public/banks.\n' +
  '// Banks not listed show their first letter instead.\n' +
  'export const BANK_LOGOS: Record<string, string> = {\n' +
  got.map(([n, f]) => `  ${JSON.stringify(n)}: '${f}',`).join('\n') +
  '\n}\n'
fs.writeFileSync(path.join('lib', 'bankLogos.ts'), ts)
console.log(`Done: ${got.length} of ${LOGOS.length} logos in public/banks, list written to lib/bankLogos.ts`)