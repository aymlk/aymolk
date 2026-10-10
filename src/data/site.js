/**
 * 站点数据层
 * 所有文案内容集中在此，组件只负责渲染。
 */

export const profile = {
  name: '金浩',
  latin: 'Aymolk',
  role: '信息安全 · 影视创作',
  lead: ['在代码的严谨与光影的呼吸之间，', '构建可信与美的边界。'],
  location: '浙江 · 杭州',
  major: '信息安全技术 / 现场工程师班',
  email: 'hi@jinhaoportfolio.com',
  phone: '138-0000-0000',
  phoneHref: 'tel:13800000000',
  wechat: 'Aymolk_Portfolio',
  school: '浙江建设职业技术学院',
}

/** Hero 左下角元信息 */
export const heroMeta = [
  profile.location,
  profile.major,
]

/** 导航项 */
export const navLinks = [
  { href: '#home', label: '首页', index: '00' },
  { href: '#about', label: '经历', index: '01' },
  { href: '#work', label: '项目', index: '02' },
  { href: '#skills', label: '优势', index: '03' },
]

/** 跑马灯关键词（复制两份实现无缝循环） */
export const marqueeKeywords = [
  { text: '信息安全' },
  { text: '✦', dot: true },
  { text: '影视创作', hot: true },
  { text: '✦', dot: true },
  { text: 'FPV 穿越机航拍' },
  { text: '✦', dot: true },
  { text: '等保测评', hot: true },
  { text: '✦', dot: true },
  { text: '商业广告' },
  { text: '✦', dot: true },
  { text: '亚运志愿者站长', hot: true },
  { text: '✦', dot: true },
  { text: '挑战杯金奖' },
  { text: '✦', dot: true },
]

/** About 中 bio 段落 */
export const bioParagraphs = [
  '金浩，信息安全技术专业学生，安恒数字安全产业学院现场工程师班成员。在校担任班长与学生会成员，连续获得特等奖学金与“优秀学生”荣誉，并在浙江省职业技能大赛信息安全评估赛道、挑战杯“人工智能+”专项赛等赛事中获奖。',
  '同时深耕影视创作，曾以摄影助理、灯光助理身份参与小鹏 P7、广汽 S7、一汽奥迪等品牌商业广告拍摄，熟练掌握 Premiere / 剪映剪辑，并具备航拍机与穿越机（FPV）操作能力。',
]

/** About 联系方式条目 */
export const contactItems = [
  { key: '邮箱', value: profile.email, href: `mailto:${profile.email}` },
  { key: '电话', value: '138-0000-0000', href: profile.phoneHref },
  { key: '城市', value: profile.location },
  { key: '微信', value: profile.wechat },
]

/** About 数据统计（countTo 触发滚动递增动画） */
export const stats = [
  { count: 12, suffix: '+', label: '荣誉奖项' },
  { count: 5, suffix: '+', label: '商业拍摄项目' },
  { count: 2, label: '专业方向' },
  { count: 1, label: '亚运志愿者站长' },
]

/** 精选项目卡片 */
export const works = [
  {
    id: '01',
    tone: 'hot',
    media: 'a',
    category: '志愿服务 / 统筹',
    title: '杭州亚运会城市侧志愿者站长',
    desc: '统筹桐庐马术场馆城市侧志愿服务，协调现场调度与应急处理，获亚运志愿服务证书。',
    year: '2023 · 杭州',
  },
  {
    id: '02',
    tone: 'cool',
    media: 'b',
    category: '信息安全 / 等保测评',
    title: '信息安全等级保护评估',
    desc: '与迪普科技协作，完成上虞区教体局、市场监督管理局、便民服务中心等单位的信息安全等级保护测评报告。',
    year: '校企合作',
  },
  {
    id: '03',
    tone: 'hot',
    media: 'c',
    category: '影视摄影 / 商业广告',
    title: '品牌商业广告拍摄',
    desc: '以摄影 / 灯光助理身份参与小鹏 P7、montane、广汽 S7、智界 R7、一汽奥迪母亲节等品牌短视频广告制作。',
    year: '橙梨影视',
  },
  {
    id: '04',
    tone: 'cool',
    media: 'd',
    category: '竞赛 / 人工智能+',
    title: '“挑战杯”人工智能+ 金奖',
    desc: '浙江省第十九届“挑战杯”大学生课外学术科技作品竞赛“人工智能+”专项赛金奖，打磨从选题到落地的完整链路。',
    year: '2025 · 金奖',
  },
]

/**
 * 精选项目的「交付结果」芯片 —— Magic Transform 右侧吐出的内容。
 * 与 works 一一对应（同长度、同序）：第 i 张文档在中轴被绞碎时，吐出第 i 条。
 * 单行短文案，芯片宽度由内容撑开。
 */
export const workResults = [
  { id: 'r01', label: '成果', body: '亚运志愿服务证书', tone: 'hot' },
  { id: 'r02', label: '交付', body: '等保测评报告 · 3 家单位', tone: 'cool' },
  { id: 'r03', label: '品牌', body: 'P7 · S7 · 奥迪母亲节', tone: 'hot' },
  { id: 'r04', label: '奖项', body: '挑战杯「AI+」金奖', tone: 'cool' },
]

/** 个人优势 Bento 卡片（points：点击卡片后逐字扫色跳出的 3 条优势） */
export const capabilities = [
  {
    id: 1,
    wide: true,
    title: '完整项目主导能力',
    desc: '从等保测评到漏洞评估，独立跟进安全交付全流程。',
    blob: 'gradient-star',
    points: ['等保测评全流程', '漏洞评估与基线核查', '评估到整改闭环'],
  },
  {
    id: 2,
    wide: true,
    title: '影像全流程执行力',
    desc: '片场灯光到后期调色，熟悉商业广告的完整链路。',
    blob: 'circles',
    points: ['片场灯光摄影执行', '剪辑调色全链路', '品牌广告完整交付'],
  },
  {
    id: 3,
    wide: false,
    title: '项目统筹提效',
    desc: '亚运志愿站长的统筹经验，从策划到落地全链路，善用 AI 工具提效。',
    blob: 'orbit',
    points: ['站长级统筹经验', 'AI 工具压缩周期', '多线并行节奏把控'],
  },
  {
    id: 4,
    wide: false,
    title: '无人机航拍',
    desc: '航拍机与穿越机（FPV）操作，擅长动态运镜与空中视角。',
    blob: 'hexagon',
    points: ['FPV 第一视角', '动态运镜设计', '航拍素材直达成片'],
  },
  {
    id: 5,
    wide: false,
    title: '跨界协同',
    desc: '校企对接、团队管理与片场协作，能快速融入项目节奏。',
    blob: 'spiral',
    points: ['校企对接需求转译', '团队与片场协作', '快速融入项目节奏'],
  },
]
