export type LetterBlock = {
  kind: "greeting" | "p" | "dua" | "signoff";
  text: string;
  /** roman-urdu lines are set in italics */
  italic?: boolean;
};

export const LETTER: LetterBlock[] = [
  { kind: "greeting", text: `My dearest Areeba,` },
  {
    kind: "p",
    text: `Some people wait all year for their birthday to feel special. You make every ordinary day around you feel special — the birthday is just the world's excuse to celebrate you out loud.`,
  },
  {
    kind: "p",
    text: `Nineteen. SubhanAllah. Happy birthday! May this year be the softest, kindest, most beautiful chapter of your life so far.`,
  },
  {
    kind: "p",
    text: `And can we please talk about your HSSC-I result? Brilliant — of course it was. You didn't get lucky; you earned every single mark, late night by late night, page by page. I'm so proud of you I'd put it on a billboard if I could. Mubarak ho! 🎉 But knowing you, this is just the opening scene. HSSC-II, then MDCAT, then a white coat with ABDULLAH stitched on it. "Dr. Areeba" has a beautiful ring to it, doesn't it?`,
  },
  {
    kind: "p",
    text: `And now — my dua for you. Read it slowly; it's from the deepest part of my heart:`,
  },
  {
    kind: "dua",
    italic: true,
    text: `Allah Pak aapko sehat o tandrusti ata farmaye, aapke ghar mein khushiyon ke din baraste rahein, aur aapki har jaiz dua qubool farmaye. Aameen.`,
  },
  {
    kind: "dua",
    text: `Ya Allah, make her a source of healing for everyone she meets. Let her hands carry shifa, her heart carry mercy. Make the road to MDCAT smooth for her, put barakah in every hour she studies, and when her result comes, let her score speak so loudly that her family's prayers turn into happy tears. Make her Dr. Areeba — the kind of doctor whose kindness starts healing patients before the medicine even does.`,
  },
  {
    kind: "dua",
    text: `May Allah grant you an even higher score in HSSC-II, success in MDCAT beyond everything you've prayed for, and a life full of noor, peace, and ajr. Aameen, summa Aameen. 🤲`,
  },
  {
    kind: "p",
    text: `Never dim your light for anyone. The world is waiting for Dr. Areeba.`,
  },
  { kind: "p", text: `Happy birthday, superstar. See you at the top.` },
  {
    kind: "signoff",
    text: `— From your friend who believes in you more than you know,\nABDULLAH`,
  },
];
