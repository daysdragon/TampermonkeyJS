interface BiliveClientHeartConfig {
  mid: number
  access_token: string
  refresh_token: string
  expires_in: number
}

interface userinfo {
  code: number
  message: string
  ttl: number
  data: userinfoData
}
interface userinfoData {
  mid: number
  access_token: string
  expires_in: number
}

interface mobileOnline {
  code: number
  message: string
  ttl: number
  data: mobileOnlineData
}
interface mobileOnlineData {
  giftlist: any[]
}
