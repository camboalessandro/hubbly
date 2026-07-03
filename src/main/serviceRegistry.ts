import { ServiceEntry } from '../shared/ipc.types'

// Icon files live in ui/public/assets/. Drop in your own SVG or PNG
// (transparent, square, >=128px) with the same filename to replace them.
export const SERVICES: ServiceEntry[] = [
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    url: 'https://web.whatsapp.com',
    partition: 'persist:whatsapp',
    automation: false,
    icon: 'assets/whatsapp.svg',
  },
  {
    id: 'telegram',
    name: 'Telegram',
    url: 'https://web.telegram.org/k/',
    partition: 'persist:telegram',
    automation: true,
    icon: 'assets/telegram.svg',
  },
  {
    id: 'teams',
    name: 'Microsoft Teams',
    url: 'https://teams.microsoft.com/',
    partition: 'persist:teams',
    automation: false,
    icon: 'assets/teams.svg',
  },
  {
    id: 'discord',
    name: 'Discord',
    url: 'https://discord.com/app',
    partition: 'persist:discord',
    automation: false,
    icon: 'assets/discord.svg',
  },
  {
    id: 'slack',
    name: 'Slack',
    url: 'https://app.slack.com/client',
    partition: 'persist:slack',
    automation: false,
    icon: 'assets/slack.svg',
  },
  {
    id: 'messenger',
    name: 'Messenger',
    url: 'https://www.messenger.com/',
    partition: 'persist:messenger',
    automation: false,
    icon: 'assets/messenger.svg',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    url: 'https://www.instagram.com/direct/inbox/',
    partition: 'persist:instagram',
    automation: false,
    icon: 'assets/instagram.svg',
  },
  {
    id: 'gmail',
    name: 'Gmail',
    // Google blocks sign-in inside a webview, so main routes it to a real
    // window (Firefox identity + clean session). `lazy` keeps the webview
    // from loading — and that window from appearing — until the user opens Gmail.
    url: 'https://mail.google.com/mail/u/0/',
    partition: 'persist:gmail',
    automation: false,
    icon: 'assets/gmail.svg',
    lazy: true,
  },
  {
    id: 'spotify',
    name: 'Spotify',
    url: 'https://open.spotify.com/intl-it',
    partition: 'persist:spotify',
    automation: false,
    icon: 'assets/spotify.svg',
  },
]

export function getService(id: string): ServiceEntry | undefined {
  return SERVICES.find((s) => s.id === id)
}
