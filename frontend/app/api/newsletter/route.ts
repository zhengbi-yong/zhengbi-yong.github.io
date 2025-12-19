import { NewsletterAPI, type NewsletterConfig } from 'pliny/newsletter'
import siteMetadata from '@/data/siteMetadata'

export const dynamic = 'force-static'

// NewsletterAPI 接受 NewsletterConfig，其中 provider 类型为特定字符串字面量联合
// siteMetadata.newsletter.provider 类型为 'buttondown'，与 NewsletterConfig 兼容
// 确保 provider 类型与 NewsletterConfig 兼容
const newsletterConfig: NewsletterConfig = {
  provider: siteMetadata.newsletter.provider,
}

const handler = NewsletterAPI(newsletterConfig)

export { handler as GET, handler as POST }
