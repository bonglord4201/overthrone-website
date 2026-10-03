// OVERTHRONE SMP rules – single source for the /rules page and the pinned forum post.
// Edit here, then run: node scripts/build-pages.mjs
//
// Text supports **bold**. Keep rules short, one idea per rule.

export const RULES_UPDATED = "2026-10-03";

export const RULES_INTRO = [
  "By joining OVERTHRONE SMP – the Minecraft server, our Discord, the forums or the store – you agree to these rules.",
  "Unless a section says otherwise, every rule applies everywhere OVERTHRONE exists: in-game, in Discord, on the forums and in private messages about the server.",
  "Staff may act on behaviour that breaks the spirit of these rules even if it is not listed. Not knowing the rules is not an excuse."
];

export const RULE_SECTIONS = [
  {
    id: "global-bans",
    title: "Global Bans",
    intro: "Breaking these rules can lead to a temporary or permanent ban from every OVERTHRONE platform.",
    rules: [
      "**No cheating.** Hacked clients, X-ray (mods, resource packs or texture tricks), freecam abuse, kill aura, auto-clickers, macros and any client mod that gives an unfair advantage are not allowed.",
      "**No exploiting.** Duplication glitches, unintended mod interactions, bypassing claims and any bug that gives an advantage are banned. Found one? Report it privately to staff – you may be rewarded.",
      "**No ban or mute evasion.** Using another account to get around a punishment extends it to every account you use.",
      "**No account sharing or selling.** You are responsible for everything done on your account.",
      "**No real-money trading.** Selling or buying in-game items, currency, Throne Shards, bases or accounts for real money or anything outside the server is not allowed.",
      "**No threats or attacks.** DDoS threats, doxxing, swatting, hacking attempts and sharing anyone's personal information result in an immediate permanent ban.",
      "**No lag machines.** Builds, farms or redstone made to lag or crash the server or other players are not allowed.",
      "**No illegal content.** Anything illegal, or links to it, is banned everywhere."
    ]
  },
  {
    id: "chat",
    title: "Chat & Global Mutes",
    intro: "Breaking these rules can lead to a warning, a mute or a ban.",
    rules: [
      "**Respect everyone.** No harassment, bullying, targeted insults or encouraging others to do so.",
      "**No hate speech or discrimination** based on race, religion, gender, sexuality, nationality, disability or anything else.",
      "**No NSFW content.** No sexual, gore or shocking content in chat, names, skins, builds, signs, books or images.",
      "**No spam.** No flooding, repeated messages, excessive caps, character spam or wall-of-text messages.",
      "**No advertising.** Do not promote other servers, IPs, websites, stores, Discord servers or your own social media without staff permission.",
      "**English in public chat** so staff can moderate it. Other languages are fine in private messages.",
      "**No impersonation** of staff, YouTubers or other players.",
      "**No drama-starting.** Keep arguments, politics and controversial topics out of public chat.",
      "**Don't share personal information** – yours or anyone else's."
    ]
  },
  {
    id: "gameplay",
    title: "SMP Gameplay",
    intro: "Rules for playing in the realms of OVERTHRONE SMP.",
    rules: [
      "**No griefing or stealing** from builds, claims or containers that are not yours.",
      "**No spawn-killing or trapping** players at spawn, portals, Gates or respawn points.",
      "**No combat logging.** Leaving the game to escape a fight counts as a loss and may be punished.",
      "**PvP only where it is enabled.** Follow the PvP rules of each realm and event.",
      "**Don't block shared areas.** Do not block Gates, dungeons, boss arenas, portals, paths or public builds, and don't camp them to stop others playing.",
      "**Keep builds appropriate.** No offensive, NSFW or political builds, and don't build right next to someone else without asking.",
      "**Fair trading.** Scamming players in trades, shops, the auction house or deals made through Discord is not allowed.",
      "**No unfair AFK farming.** AFK machines that abuse mods or bypass AFK limits are not allowed.",
      "**Report bugs, don't abuse them.** Use the Bug Reports forum or a Discord ticket."
    ]
  },
  {
    id: "discord",
    title: "Discord",
    intro: "The Chat & Global Mutes rules also apply in Discord.",
    rules: [
      "**Use the right channels** and stay on topic.",
      "**Don't ping staff or roles** without a real reason. For help, open a ticket.",
      "**No unsolicited DMs** to members for advertising, trading or scams.",
      "**Keep your profile appropriate** – name, avatar, status and banner.",
      "**Voice chat:** no soundboards, earrape, screaming or recording people without their permission.",
      "**Follow Discord's Terms of Service** and Community Guidelines."
    ]
  },
  {
    id: "forums",
    title: "Forums",
    intro: "Rules for the OVERTHRONE forums on this website.",
    rules: [
      "**Post in the right category** and use a clear title.",
      "**No spam, bumping or low-effort posts.** Don't reply just to raise your post count.",
      "**No necroposting** – don't revive old threads unless you have something useful to add.",
      "**Player Reports** need proof (video or screenshots) and should stay factual. Don't call players out in public threads.",
      "**Suggestions** should be constructive. Explain the idea and why it helps the server.",
      "**Don't argue with staff decisions in public.** Use an appeal instead."
    ]
  },
  {
    id: "store",
    title: "Store & Purchases",
    intro: "Rules for purchases made on the OVERTHRONE store (powered by Tebex).",
    rules: [
      "**All purchases are final.** Digital items are delivered instantly and cannot be refunded unless required by law.",
      "**Chargebacks and payment disputes** lead to a permanent ban on every OVERTHRONE platform.",
      "**Use your exact Minecraft username** at checkout. We can't move purchases made to the wrong account.",
      "**Ranks and perks do not protect you from the rules.** Banned players do not get refunds.",
      "**Perks may change** as the server develops, to keep gameplay fair and balanced.",
      "**Only buy from the official store.** Purchases from anyone else are real-money trading and are not allowed."
    ]
  },
  {
    id: "punishments",
    title: "Punishments & Appeals",
    intro: "How staff handle rule breaks.",
    rules: [
      "**Punishments usually escalate:** warning → mute → temporary ban → permanent ban. Serious rule breaks can skip straight to a permanent ban.",
      "**Staff decisions are final in the moment.** If you think a punishment was unfair, appeal it – don't argue in chat.",
      "**Appeals** are made through a ticket in our Discord. Be honest and include your username, the punishment and why it should be reviewed.",
      "**Lying to staff** or faking evidence makes a punishment worse.",
      "**These rules can change at any time.** Check this page for the latest version."
    ]
  }
];
