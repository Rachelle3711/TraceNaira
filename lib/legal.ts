// Words for the Terms and Privacy pages. Change them here and both pages update.
// Change UPDATED whenever the meaning changes.

export const UPDATED = '24 November 2026'

// A paragraph, a paragraph with a bold lead-in, or a bullet list
export type Block = string | { b: string; t: string } | { li: string[] }
export type LegalDoc = { title: string; intro: string[]; sections: { h: string; body: Block[] }[] }

export const PRIVACY: LegalDoc = {
  title: 'Privacy policy',
  intro: [
    "This explains what TraceNaira collects, why we need it and how you stay in control. We only ask about the transfer, never your PIN, OTP or BVN, and nothing about the person you paid. We don't sell your data or show ads, and you can export or delete everything from Profile at any time.",
  ],
  sections: [
    {
      h: 'Who we are',
      body: [
        'TraceNaira is a free app that helps you follow a failed or stuck payment and get your money back. In this policy, “we” means TraceNaira and “you” means anyone using the app.',
        'This policy follows the Nigeria Data Protection Act 2023.',
        'Questions or privacy requests: email tracenaira@gmail.com and we will reply as soon as we can.',
      ],
    },
    {
      h: 'What we collect',
      body: [
        { b: 'Your account:', t: ' your name, email address and phone number. If you use Google, we get your name and email from Google. Your password is handled by Google Firebase; we never see it.' },
        { b: 'Your cases:', t: ' the amount, sending bank, receiving bank, payment type, date and time you sent it, and what your bank app showed. For ATM cases, where the ATM is. If you add it, the session ID from your receipt. Then whether the money arrived or came back, and when.' },
        { b: 'If you turn on phone alerts:', t: ' a code from your browser that lets us send alerts to this phone, the type of phone and browser, and which alerts you chose. We delete it when you log out, turn alerts off in your browser, or delete your account.' },
        { b: 'On your phone only:', t: " your settings (like dark mode), which notifications you've read, and a guest case if you haven't made an account yet. These stay in your browser and don't reach us." },
      ],
    },
    {
      h: 'What we never ask for',
      body: [
        "Your PIN, OTP, BVN, card number, full account number or bank password. We also don't collect anything about the person you sent money to. If anyone claiming to be TraceNaira asks for these, it isn't us.",
      ],
    },
    {
      h: 'Why we use it',
      body: [
        {
          li: [
            'To keep your cases and show you where your money is',
            'To work out when it should arrive or come back, using CBN rules',
           'To show you alerts, in the app and on your phone if you turn them on, when a transfer is late or a refund is due',
            'To keep your account safe',
          ],
        },
        'We use your account details because you asked us to keep your cases (your agreement to these Terms), and your case details to provide the tracking you asked for.',
      ],
    },
    {
      h: 'The shared timing pool',
      body: [
        'When you close a case, we add one anonymous record to a shared pool: the two banks, the payment type, what the bank app showed, how many minutes it took and whether the money arrived or came back.',
        'It has no name, amount, account number, session ID or anything that links it to you. Once there are enough records, everyone sees better estimates, like “most similar cases arrived within 3 hours”.',
      ],
    },
    {
      h: 'Who else handles it',
      body: [
        { b: 'Google Firebase', t: ' stores your account and cases and handles sign-in.' },
        { b: 'Netlify', t: ' hosts the app.' },
        { b: 'Fontshare', t: " supplies the app's font, so your browser contacts it when a page loads." },
        "Their servers may be outside Nigeria. They only process data to run the app for us, under their own security and data-protection terms. We don't sell or share your data with anyone else, including banks, unless the law requires it.",
      ],
    },
    {
      h: 'How long we keep it',
      body: [
        "We keep your account and cases until you delete them. Clear history removes cases straight away. Delete account removes your login, your details and all your cases. Anonymous records in the timing pool stay, because they can't be traced back to you.",
      ],
    },
    {
      h: 'Your rights',
      body: [
        'Under the Nigeria Data Protection Act you can:',
        {
          li: [
            'See your data: History, or Export in Profile',
            'Correct it: Edit details in Profile',
            'Take a copy: Export gives you a CSV file',
            'Delete it: Clear history or Delete account in Profile',
            'Withdraw your agreement by deleting your account',
            'Complain to the Nigeria Data Protection Commission (ndpc.gov.ng)',
          ],
        },
        'To ask for any of these, or if something in the app doesn\'t work for you, email tracenaira@gmail.com.',
      ],
    },
    {
      h: 'Keeping it safe',
      body: [
        "Everything travels over an encrypted connection. Our database rules mean only you can read your cases when signed in. No system is perfectly secure, so use a strong password and keep your email account safe. If a breach affects you, we'll tell you and the Commission as the law requires.",
      ],
    },
    { h: 'Age', body: ['TraceNaira is for people aged 18 and over.'] },
    {
      h: 'Changes',
      body: ["If we change this policy, we'll update the date at the top and tell you in the app before the change matters to you."],
    },
  ],
}

export const TERMS: LegalDoc = {
  title: 'Terms of use',
    intro: ["These terms explain how TraceNaira works and what we each agree to. TraceNaira is a free tracking tool, not a bank: it can't move or reverse money, and the times it shows are estimates, because your bank has the final say."],
  sections: [
    {
      h: 'Agreeing to these terms',
      body: ["By creating an account or reporting a case, you agree to these terms and our Privacy policy. If you don't agree, please don't use TraceNaira."],
    },
    {
      h: 'What TraceNaira does',
      body: [
        'TraceNaira helps you follow a failed or stuck payment: it shows where your money probably is, when it should arrive or come back, and who to contact. It can also prepare a message for you to send to your bank.',
      ],
    },
    {
      h: "What it doesn't do",
      body: [
        {
          li: [
            'We are not a bank, payment company or part of the CBN, and no bank is working with us',
            "We can't see your bank account, move money or reverse a transfer",
            "We don't contact your bank for you",
            'Nothing in the app is financial or legal advice',
          ],
        },
      ],
    },
    {
      h: 'Estimates',
      body: [
        'Times come from published CBN rules and anonymous timings from other users. They are a guide, not a promise. Your bank may take longer, and only your bank can confirm where your money is. Always check with them.',
      ],
    },
    {
      h: 'Your account',
      body: [
        {
          li: [
            'You must be 18 or older',
            'Give true details and keep them up to date',
            "Keep your password private. You're responsible for what happens in your account",
          ],
        },
        'Without an account you can track one case on one phone. To keep it or track more, you need an account.',
      ],
    },
    {
      h: 'Using it fairly',
      body: [
        "Only report payments you made. Don't enter false cases, try to break or overload the app, copy its data, or use it to mislead anyone. We may suspend or remove accounts that do.",
      ],
    },
    {
      h: 'Messages you send',
      body: ["The app can draft a message to your bank. You choose whether to send it, and you're responsible for what you send."],
    },
    {
      h: 'Free to use',
      body: ["TraceNaira is free. If that ever changes, we'll tell you first, and nothing will be charged without your clear agreement."],
    },
    {
      h: 'Our responsibility',
      body: [
        "We work hard to keep TraceNaira accurate and available, but it's provided “as is”. As far as Nigerian law allows, we aren't responsible for losses from bank delays, a bank's decision, outages, or acting on an estimate. This doesn't remove any right you have under consumer protection law.",
      ],
    },
    {
      h: 'Ending',
      body: ['You can delete your account at any time in Profile. We may close the app or an account with notice where we can.'],
    },
    {
      h: 'Changes and law',
      body: [
        "If we change these terms, we'll update the date at the top and tell you in the app. These terms are governed by the laws of the Federal Republic of Nigeria.",
      'Questions about these terms: email tracenaira@gmail.com.',
    ],
    },
  ],
}