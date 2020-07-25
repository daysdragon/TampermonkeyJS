interface BiliveClientHeartConfig {
  mid: number
  access_token: string
  refresh_token: string
  expires_in: number
}
// 房间信息
interface Window {
  BilibiliLive: BilibiliLive
}
interface BilibiliLive {
  ANCHOR_UID: number
  COLORFUL_LOGGER: boolean
  INIT_TIME: number
  RND: number
  ROOMID: number
  SHORT_ROOMID: number
  UID: number
}
// 用户信息
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
// 心跳
interface mobileOnline {
  code: number
  message: string
  ttl: number
  data: mobileOnlineData
}
interface mobileOnlineData {
  giftlist: any[]
}
// 勋章
interface fansMedalLlist {
  code: number
  msg: string
  message: string
  data: fansMedalLlistData[]
}
interface fansMedalLlistData {
  uid: number
  target_id: number
  medal_id: number
  score: number
  level: number
  intimacy: number
  status: number
  source: number
  receive_channel: number
  is_receive: number
  master_status: number
  receive_time: string
  today_intimacy: number
  last_wear_time: number
  is_lighted: number
  medal_level: number
  next_intimacy: number
  day_limit: number
  medal_name: string
  master_available: number
  guard_type: number
  lpl_status: number
  can_delete: boolean
  target_name: string
  target_face: string
  live_stream_status: number
  icon_code: number
  icon_text: string
  rank: string
  medal_color: number
  medal_color_start: number
  medal_color_end: number
  guard_level: number
  medal_color_border: number
  today_feed: number
  buff_msg: string
  room_id: number
  sup_code: number
  sup_text: string
}
