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
/**
 * 包裹信息
 *
 * @interface bagList
 */
interface bagList {
  code: number
  message: string
  ttl: number
  data: bagListData
}
interface bagListData {
  list: bagListDataList[]
  time: number
}
interface bagListDataList {
  bag_id: number
  gift_id: number
  gift_name: string
  gift_num: number
  gift_type: number
  expire_at: number
  corner_mark: string
  corner_color: string
  count_map: bagListDataListCountMap[]
  bind_roomid: number
  bind_room_text: string
  type: number
  card_image: string
  card_gif: string
  card_id: number
  card_record_id: number
  is_show_send: boolean
}
interface bagListDataListCountMap {
  num: number
  text: '' | '全部'
}
/**
 * 勋章信息
 *
 * @interface fansMedal
 */
interface fansMedal {
  code: number
  msg: string
  message: string
  data: fansMedalData[]
}
interface fansMedalData {
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
/**
 * 小心心
 *
 * @interface mobileHeartBeat
 */
interface mobileHeartBeat {
  code: number
  message: string
  ttl: number
  data: mobileHeartBeatData
}

interface mobileHeartBeatData {
  heartbeat_interval: number
  timestamp: number
  secret_rule: number[]
  secret_key: string
}