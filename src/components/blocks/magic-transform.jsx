import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { useElementWidth, usePrefersReducedMotion } from '../../hooks'
import ParallaxPills from '../ParallaxPills'

/**
 * Magic Transform —— Documents fly in and come out as colorful results
 * -------------------------------------------------------------------
 * React Bits Starter `@reactbits-starter/magic-transform-tw` 的**本地等效实现**。
 *
 * 为什么是复刻：`@reactbits-starter` 属付费层，未带 license key 请求
 * https://pro.reactbits.dev/api/r/starter/magic-transform-tw.json 返回 401
 * （"The starter plan is a paid tier"）。本文件的 props 形状与官方文档一致，
 * 拿到密钥后执行下面这条命令即可用官方实现覆盖本文件：
 *   npx shadcn@latest add @reactbits-starter/magic-transform-tw
 *
 * 动效结构（对齐官方演示图）：
 *   左侧文档流匀速右移 → 每 documentDuration 秒有一张文档抵达中轴
 *   → 在中轴被绞碎 → 右侧吐出一整把结果卡，并在中轴与结果卡之间炸出一片彩色方块。
 *   结果卡不是一行等距排列，而是**沿对角线扇形铺开**（每张右移+下移+微旋转），
 *   每张卡左上角压着一枚配色胶囊（pill）—— 这是官方演示图的关键特征。
 *
 *   **卡片是「同时」出场的，不是一张一张排队飞**：它们是同一批文档的产出，
 *   逐个飞出会被读成先后顺序，而且填满 5 个扇位要等 5 个节拍（20 秒）才第一次看全。
 *   现在每拍整把扇子一起刷新（见 SIMULTANEOUS_RESULTS）。
 *
 *   一个完整节拍的节奏：文档被中轴绞碎 → **当前这批结果卡各自向下坠出舞台**
 *   → 坠完那一刻换上下一批内容 → 新的一批从上方滑进来、**一路不停**地落到位
 *     （领入段收尾带着向下速度交给落位弹簧，中间没有「停死再启动」的死点）。
 *   （离场不是装饰：入场动画的淡入延迟等于 entryHold，若不先把旧的移走，
 *     每拍开头会有 ~180ms 整批不可见 —— 右侧看起来「空了一下」。）
 *
 * 与官方默认值的三处偏离（均为适配本项目）：
 *   1. axisColor 默认用项目主色 --accent（官方默认 #7C3AED 紫，会破坏双色 identity）
 *   2. 结果卡保留真实文案（官方是骨架灰条）。本项目要求右侧承载「项目详细」，
 *      所以卡片里放真实内容，配色胶囊承担官方那种彩色块面的作用。
 *   3. 未引入任何第三方动画库，用 rAF + CSS 实现
 *
 * 配色胶囊的取色见 PILL_SWEEP_MODE：默认沿品牌渐变（绯红→电青）在 oklab 里插值，
 * 既有官方那种「一排不同颜色的块」的丰富度，又不引入第三种强调色。
 * 若以后允许开放多色，把 PILL_SWEEP_MODE 改成 'official' 即可切到官方那套 5 色。
 */

/** 官方默认是「4 procedural docs」，这里给一组同规格占位数据 */
const DEFAULT_DOCUMENTS = [
  { id: 'd1', index: '01', category: 'Document', title: 'Scanned intake', meta: 'Page 01' },
  { id: 'd2', index: '02', category: 'Document', title: 'Field note', meta: 'Page 02' },
  { id: 'd3', index: '03', category: 'Document', title: 'Signed form', meta: 'Page 03' },
  { id: 'd4', index: '04', category: 'Document', title: 'Receipt stack', meta: 'Page 04' },
]

/** 官方默认是「5 result types」（email / total / address / order / item lines） */
const DEFAULT_RESULTS = [
  { id: 'r1', label: 'Email', body: 'hello@example.com', tone: 'hot' },
  { id: 'r2', label: 'Total', body: '—', tone: 'hot' },
  { id: 'r3', label: 'Address', body: '—', tone: 'cool' },
  { id: 'r4', label: 'Order', body: '—', tone: 'cool' },
  { id: 'r5', label: 'Items', body: '—', tone: 'hot' },
]

const toneOf = (item, i) => item.tone || (i % 2 ? 'cool' : 'hot')

/* ------------------------------------------------------------------
   结果卡配色胶囊的取色方式
   'brand'    —— 沿品牌渐变（--accent 绯红 → --volt 电青）在 oklab 里插值（默认）
   'official' —— 官方演示图那套五色（橄榄绿/洋红/蓝/紫/橙）
   官方用的是彼此无关的五种色相，直接照抄会引入第三及以上强调色、
   与项目「严格双色」约定冲突；worst case 改一行即可切换。
   ------------------------------------------------------------------ */
const PILL_SWEEP_MODE = 'brand'
const OFFICIAL_PILL_COLORS = ['#a3b73f', '#e0468a', '#3f8fd8', '#8b5cf6', '#e08b3a']

/** 0 → 绯红，1 → 电青。
    必须用 hsl 插值：oklab / rgb 的端点都在有彩色上，直插会从无彩轴附近穿过，
    中段变成灰白（实测「品牌」那枚几乎白掉，整排就不花了）。
    hsl 保持 S=100%，且 hue 走 350°→187° 的短弧，途经洋红、紫、蓝，整排都饱和。 */
const pillColor = (t) =>
  `color-mix(in hsl, var(--volt) ${(Math.max(0, Math.min(1, t)) * 100).toFixed(1)}%, var(--accent))`

/** 胶囊底色。t 由结果序号推出，保证相邻两张卡颜色不同（官方也是如此）。 */
const pillBackground = (t, i) =>
  PILL_SWEEP_MODE === 'official'
    ? OFFICIAL_PILL_COLORS[i % OFFICIAL_PILL_COLORS.length]
    : pillColor(t)

/** 中轴中心块的默认内容（官方默认是 React Bits 的四角星标，这里用同构的四角星） */
function DefaultCenterContent() {
  return (
    <svg viewBox="0 0 24 24" width="52%" height="52%" aria-hidden="true">
      <path
        d="M12 1.6c.5 4.9 5.5 9.9 10.4 10.4-4.9.5-9.9 5.5-10.4 10.4-.5-4.9-5.5-9.9-10.4-10.4C6.5 11.5 11.5 6.5 12 1.6Z"
        fill="currentColor"
      />
    </svg>
  )
}

export default function MagicTransform({
  documents = DEFAULT_DOCUMENTS,
  results = DEFAULT_RESULTS,
  height = 560,
  width = '100%',
  documentDuration = 4,
  documentWidth = 220,
  documentHeight = 320,
  documentGap = 60,
  particleCount = 18,
  centerSize = 56,
  axisColor = 'var(--accent)',
  backgroundColor = 'transparent',
  centerContent,
  paused = false,
  classNames = {},
  className = '',
  style,
}) {
  const reduceMotion = usePrefersReducedMotion()
  const stageRef = useRef(null)
  const docNodes = useRef([])

  const [beat, setBeat] = useState(0)
  /** 结果扇的「一次刷新」：只存批次号 + 内容轮转偏移，不存卡片数组。
      卡片序列在渲染时按当次扇位数量 n 现算 —— 这样窗口缩放导致 n 变化时
      （5↔3↔2）不需要等下一个节拍就能立刻补上／收掉卡片。 */
  const [batch, setBatch] = useState(null)
  const [bursts, setBursts] = useState([])
  /** 换拍时递增 → 右侧这一批结果卡各自向下坠出舞台。
      内容**不在换拍瞬间替换**，而是等坠完（子组件回调 onReenter）才换：
      否则「正在往下掉的」和「刚落下来的」会变成同一批卡片，读起来就是
      「卡片刚出来就掉了」。 */
  const [exitKey, setExitKey] = useState(0)

  const count = documents.length || 1
  const stageW = useElementWidth(stageRef)

  /* 窄屏（手机）自动缩小文档卡。倍率取 0.44 而不是 0.52 是量出来的：
     文档的右缘最多走到中轴（= stageW/2），左缘 = stageW/2 - docW。
     若 docW 超过 stageW/2，卡片的左半部分（编号、分类、标题都在左侧对齐）
     永远留在屏幕外，手机上只看得到一条空白网格。0.44 保证 docW < stageW/2，
     卡片在被中轴吞掉之前能完整露出来。 */
  const narrow = stageW > 0 && stageW < 720
  const docW = narrow ? Math.round(Math.min(documentWidth, stageW * 0.44)) : documentWidth
  const docH = narrow ? Math.round(docW * (documentHeight / documentWidth)) : documentHeight
  const gap = narrow ? Math.round(documentGap * 0.6) : documentGap
  const slot = docW + gap

  // 左侧需要多少张文档才能铺满半屏
  const docSlots = Math.max(4, Math.ceil((stageW / 2 + docW) / slot) + 2)

  /* ---------- 结果卡的扇形排布 ----------
     官方演示图里结果不是一行等距排列，而是一叠沿对角线铺开的卡：
     每张往右下挪一点、带一点旋转、左上角压一枚配色胶囊，
     越新的卡越靠近中轴（index 0 = 最新）。
     三档配置按舞台实测宽度选，硬约束是「x0 + (n-1)*dx + w ≤ stageW/2 - 8」：
       桌面 44 + 4*26 + 180 = 328 ≤ 672
       中屏 34 + 2*20 + 150 = 224 ≤ 356
       窄屏 22 + 1*14 + 128 = 164 ≤ 167   （350 舞台，已贴到上限）
     卡片尺寸也一并下发（--magic-result-w），否则窄屏会顶出舞台右缘。

     dy 必须 **大于该档卡片渲染后的真实高度**，否则上下的卡会互相压住
     （下面的卡顶部连胶囊一起被盖掉）。这不是拍脑袋定的 —— 卡片高度取决于
     正文在该宽度下折几行，所以各档不一样，实测：
       w=180 → 正文一行，卡高 72px
       w=150 → 正文两行，卡高 90px
       w=128 → 正文两行，卡高 90px
     于是 dy 分别取 84 / 102 / 102，净间隙都是 +12px。
     （早期统一取 68~76 是按 180px 卡高量的，切到窄档就叠撞了；
      校验脚本 `.workbuddy/tools/magic-check.cjs` 现在会按未旋转的逻辑盒报净间隙。）
     纵向由 -(n-1)/2*dy 起算让整叠居中，半高最坏情况 ±126+38 = 164 ≤ 280（舞台 560）。
     `h` 是交给 ParallaxPills 的统一药丸高度（px）：卡片高度必须显式下发，
     因为入场弹簧的起点是按「药丸高度的百分比」算的（entryDistance=220 → 从 2.2 倍高度上方落下），
     高度不定就没法定位。取值同样来自上面的实测，比 dy 小 8px 留净间隙。 */
  const FAN_TIERS = [
    { n: 5, x0: 44, dx: 26, dy: 84, rot0: -7, drot: 1.8, w: 180, h: 76, min: 1040 },
    { n: 3, x0: 34, dx: 20, dy: 102, rot0: -6, drot: 2, w: 150, h: 94, min: 620 },
    { n: 2, x0: 22, dx: 14, dy: 102, rot0: -6, drot: 2.5, w: 128, h: 94, min: 0 },
  ]
  const fan = FAN_TIERS.find((f) => stageW >= f.min) || FAN_TIERS[FAN_TIERS.length - 1]
  /* 实际扇位数 = 档位上限与结果条数取小（本项目 workResults 是 4 条，桌面档位给 5）。
     y0 由实际张数反算居中，写成 -(n-1)/2*dy 后 n=5/3/2 分别得到 -152/-74/-34，
     与原来写死的三个 y0 完全一致，所以这不是行为变更。 */
  const resultCount = Math.max(1, Math.min(fan.n, results.length))
  /* 各扇位的跟随倍率：越远离中轴（越「靠后」）的卡跟光标动得越少，
     这样四张卡在鼠标移动时会拉开层次，而不是整块一起平移。 */
  const FAN_PARALLAX = [1, 0.8, 0.62, 0.46, 0.32]

  /** 第 i 张结果卡的位置／角度（i=0 最靠近中轴）。
      透明度只做很轻的递减（1 → 0.78）留一点纵深：
      原来的 1 → 0.5 是给「依次出场」用的 —— 越新越亮，远端是还没轮到的旧卡。
      改成整批同时出之后这个语义没了，继续用到 0.5 会被读成「最后一张正在淡出」。 */
  const fanAt = (i, n = resultCount) => ({
    x: fan.x0 + i * fan.dx,
    y: (-((n - 1) / 2) + i) * fan.dy,
    rot: fan.rot0 + i * fan.drot,
    opacity: Math.max(1 - i * 0.06, 0.78),
  })

  /* ---------- 落位弹簧的「接管高度」（药丸高度的百分比，交给 ParallaxPills.entryDistance）----------
     领入段滑到这个高度就把卡片交给落位弹簧，由弹簧减速、回弹、收敛。
     它**不能写死**（官方默认 220 更不行），原因有两条：
     ① 高度越大，弹簧的回弹过冲越大（过冲 ≈ 17% × 接管高度），
        而净间隙只有 8px —— 220% 时过冲 28px，卡片会压到下面那张。
     ② 它以前还是「悬停位」，必须整张落在舞台内；当初淡入延迟等于 entryHold，
        悬停那段是不可见的，所以一直没暴露，写死 130% 在 1080 视口（3 枚档）
        会让最上面那张的外接框顶边到 **−6px**，被舞台顶边切掉。
     反推链条：
       最上面那张的静止顶边 = height/2 − (n−1)/2·dy − h/2
       旋转让外接框顶边再抬高 ≈ (w·sinθ + h·cosθ − h)/2，θ 最不利 = |rot0| + hingeAngle
       （铰链是随机的 ±hingeAngle，叠加在固定倾角 rot0 上）
     再留 9px 余量。顺带限制上限 130%，避免窄档（2 枚）算出过长的下落。 */
  const HINGE_ANGLE = 6
  const hingeMaxRad = ((Math.abs(fan.rot0) + HINGE_ANGLE) * Math.PI) / 180
  const bboxOverhang = (fan.w * Math.sin(hingeMaxRad) + fan.h * Math.cos(hingeMaxRad) - fan.h) / 2
  const topRestTop = height / 2 - ((resultCount - 1) / 2) * fan.dy - fan.h / 2
  const entryDistance = Math.min(130, Math.max(60, ((topRestTop - bboxOverhang - 9) / fan.h) * 100))

  // rAF 循环通过 ref 读取配置，避免每次节拍都重建循环
  const cfgRef = useRef({})
  cfgRef.current = {
    slot,
    documentWidth: docW,
    docSlots,
    /* 让文档右缘能真正越过多走「一张卡宽」的距离穿到中轴另一边。
       没有这段额外行程，文档右缘最远只能停在中轴线上，永远不会「穿过」，
       也就没法表现被中轴吃掉的过程（见 paint 里的说明）。 */
    overshoot: docW,
    durationMs: Math.max(documentDuration, 0.4) * 1000,
    paused,
  }

  const beatNoRef = useRef(0)
  const chipKeyRef = useRef(0)
  const burstKeyRef = useRef(0)
  const resultsRef = useRef(results)
  const particleRef = useRef(particleCount)
  resultsRef.current = results
  particleRef.current = particleCount
  /* fireBeat / handleReenter 都是空依赖的 useCallback，拿不到最新的 props/派生值，
     所以把要用的量挂到 ref 上（和 resultsRef 一个路子）。
     ↓ 换拍那一刻先存下来、等卡片坠完再真正换上的内容偏移 */
  const pendingOffsetRef = useRef(0)

  /** 只在节拍边界调用：推进节拍 → 通知结果卡下坠 → 炸粒子 */
  const fireBeat = useCallback(() => {
    const beatNo = beatNoRef.current++
    setBeat(beatNo + 1)

    const list = resultsRef.current
    if (list.length) {
      if (beatNo === 0) {
        /* 挂载补的那一拍：右侧本来是空的，没有「旧的一批」可坠，直接铺上，
           入场由 ParallaxPills 自己的挂载弹簧完成。 */
        setBatch({ key: chipKeyRef.current++, offset: 0 })
      } else {
        /* 之后的每一拍：先让当前这批各自坠出舞台（内容保持不变），
           坠完由 handleReenter 换上下一批 —— 见 exitKey 的注释。 */
        pendingOffsetRef.current = beatNo
        setExitKey((k) => k + 1)
      }
    }

    const n = Math.max(0, Math.min(48, particleRef.current))
    if (n) {
      const points = Array.from({ length: n }, (_, i) => {
        /* 官方演示图里碎的是**小方块**（带一点旋转），不是圆点；
           而且它们聚集在中轴和结果卡之间的扇形区域里，而不是四散。
           角度收在 ±0.42rad，让碎片沿右侧扇面飞。 */
        const angle = (Math.random() - 0.5) * 0.84
        const dist = 46 + Math.random() * 120
        return {
          i,
          tx: Math.cos(angle) * dist,
          ty: Math.sin(angle) * dist * 1.15,
          size: 5 + Math.random() * 8,
          rot: `${Math.round((Math.random() - 0.5) * 90)}deg`,
          dur: 620 + Math.random() * 520,
          // 沿品牌渐变随机取色，让碎片和胶囊同源
          t: Math.random(),
        }
      })
      const key = burstKeyRef.current++
      setBursts((prev) => [{ key, points }, ...prev].slice(0, 2))
    }
  }, [])

  /** 旧的一批坠完 → 换上下一批内容（ParallaxPills 紧接着会重放入场）。 */
  const handleReenter = useCallback(() => {
    const list = resultsRef.current
    if (!list.length) return
    setBatch({ key: chipKeyRef.current++, offset: pendingOffsetRef.current })
  }, [])

  /** 每帧写入文档位置。位置对 p 必须是线性的 —— 节拍交界处靠 k 位移一格
   *  与内容周期 N 重复来保证视觉连续，任何缓动都会在这个交界处产生跳变。 */
  const paint = useCallback((p) => {
    const { slot: s, documentWidth: w, overshoot: ov } = cfgRef.current
    const nodes = docNodes.current
    for (let k = 0; k < nodes.length; k++) {
      const el = nodes[k]
      if (!el) continue
      const rightEdge = -(1 - p) * s - k * s + ov
      el.style.transform = `translate3d(${rightEdge - w}px, -50%, 0)`

      /* 清掉早期版本残留的内联 clip-path。热更新只重渲染组件、不重建这些 DOM 节点，
         旧 clip-path 会一直挂在新逻辑上（节点上是同一个元素）。 */
      if (el.style.clipPath && el.style.clipPath !== 'none') el.style.clipPath = 'none'

      /* 绞碎机模型：只吃掉**已经越过中轴**的那一段，左侧没进机器的部分原样保留。
         早期版本写的是 `inset(0 0 0 t%)`（裁左侧、留右侧），而且从 p=0.5 就开始，
         结果卡片在离中轴还有一百多像素时就被削成一条，最后剩一段悬在半空的碎片
         —— 看起来就是「没走到中轴就提前消失了」。
         现在 eaten 直接由几何位置推出：右缘越线多少就吃掉多少，
         于是卡片一定以完整宽度抵达中轴，且消失永远恰好发生在中轴线上。
         左侧保留还有个好处：编号/分类/标题都是左对齐的，读者能一直看到卡片内容。

         用 mask 而不是 clipPath：clipPath 是硬切边，会把文字拦腰截断（「信息安全等级保」）。
         mask 的渐变收尾宽度取 22px，让断口像被机器溶解，
         且剩余宽度不足 22px 时整段一起淡出，收得干净。 */
      const eaten = Math.min(Math.max(rightEdge, 0), w)
      if (eaten > 0.5) {
        const visibleEnd = w - eaten
        const soft = Math.min(22, Math.max(visibleEnd, 1))
        const grad = `linear-gradient(90deg, #000 ${(visibleEnd - soft).toFixed(1)}px, rgba(0,0,0,0) ${visibleEnd.toFixed(1)}px)`
        if (el.__magicMask !== grad) {
          el.__magicMask = grad
          el.style.webkitMaskImage = grad
          el.style.maskImage = grad
        }
        el.style.filter = `brightness(${(1 + (eaten / w) * 0.6).toFixed(2)})`
        /* 断口处的竖向光束（官方演示图里是被吃掉那张卡右缘的一道紫色光柱）。
           位置就是断面所在处：从卡片右缘往回量 eaten 像素，交给 CSS 定位。 */
        el.style.setProperty('--magic-burn-x', `${eaten.toFixed(1)}px`)
        el.style.setProperty('--magic-burn-a', Math.min(eaten / 56, 1).toFixed(2))
      } else if (el.__magicMask) {
        el.__magicMask = null
        el.style.webkitMaskImage = 'none'
        el.style.maskImage = 'none'
        el.style.filter = 'none'
        el.style.setProperty('--magic-burn-a', '0')
      } else if (el.style.filter && el.style.filter !== 'none') {
        // 同上：清理旧逻辑残留的内联 filter
        el.style.filter = 'none'
        el.style.setProperty('--magic-burn-a', '0')
      }
    }
  }, [])

  useEffect(() => {
    if (reduceMotion) return

    let raf = 0
    let start = null

    const loop = (now) => {
      const cfg = cfgRef.current
      if (!cfg.paused) {
        if (start == null) start = now
        let p = (now - start) / cfg.durationMs
        if (p >= 1) {
          // 只补一个节拍：标签页切回来时不会一次性补发一堆
          start = now
          p = 0
          fireBeat()
        }
        paint(p)
      } else {
        paint(0)
      }
      raf = requestAnimationFrame(loop)
    }

    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [reduceMotion, fireBeat, paint])

  useEffect(() => {
    if (reduceMotion) return
    paint(0)
  }, [docSlots, reduceMotion, paint])

  /* 首屏就先把扇子铺上：rAF 循环要到第一个节拍结束（documentDuration 秒）才 fireBeat，
     在那之前右侧是空的。整把扇子同时出后这段空白更显眼，所以挂载时先补一拍。 */
  const primedRef = useRef(false)
  useEffect(() => {
    if (reduceMotion || primedRef.current) return
    primedRef.current = true
    fireBeat()
  }, [reduceMotion, fireBeat])

  const activeIndex = beat % count
  const nth = (k) => documents[(activeIndex + k) % count]
  const center = centerContent === undefined ? <DefaultCenterContent /> : centerContent

  /* 本拍要展示的结果卡序列：按当前扇位数 n 从 results 里轮转取 n 条。
     放在渲染期现算而不是存进 state，窗口缩放改了 n 就立刻生效。 */
  const shown = batch
    ? Array.from({ length: resultCount }, (_, i) => {
        const idx = (batch.offset + i) % results.length
        const r = results[idx]
        return {
          i,
          idx,
          item: r,
          tone: toneOf(r, idx),
          /* 胶囊颜色绑**结果自身的序号**，不绑扇位：
             否则每拍轮转后「成果」一会儿绯红一会儿电青，简历里读起来像在换标签。 */
          t: results.length > 1 ? idx / (results.length - 1) : 0,
        }
      })
    : []

  /* 结果卡交给 ParallaxPills 渲染：
     它负责「短暂悬浮后落下」的入场弹簧，以及鼠标移上来时的跟随漂移。
     这里只把扇形的**位置**翻译成官方那套百分比坐标系（x/y/width 都是容器百分比）。
     stageW 为 0 时（首帧还没量到宽度）先不渲染，否则会算出 NaN%。 */
  const ppPills = stageW > 0
    ? shown.map((c) => {
        const f = fanAt(c.i)
        return {
          label: c.item.label,
          body: c.item.body,
          tagColor: pillBackground(c.t, c.idx),
          background: '#1b1c1f',
          color: 'var(--text)',
          x: ((stageW / 2 + f.x) / stageW) * 100,
          y: ((height / 2 + f.y - fan.h / 2) / height) * 100,
          width: (fan.w / stageW) * 100,
          rotate: f.rot,
          opacity: f.opacity,
          parallax: FAN_PARALLAX[c.i] ?? 0.4,
        }
      })
    : []

  /* ---------- 降级：减少动态效果时给静态排版 ---------- */
  if (reduceMotion) {
    return (
      <div className={cn('magic-static', className)} style={style}>
        <div className="magic-static__docs">
          {documents.map((d, i) => (
            <div
              className={cn('magic-doc__inner', `magic-doc__inner--${toneOf(d, i)}`)}
              key={d.id ?? i}
              style={{ height: documentHeight }}
            >
              <div className="magic-doc__media">
                <span className="magic-doc__pixels" aria-hidden="true" />
                <span className="magic-doc__index">{d.index ?? String(i + 1).padStart(2, '0')}</span>
                <span className="magic-doc__cat">{d.category}</span>
              </div>
              <div className="magic-doc__body">
                <span className="magic-doc__title">{d.title}</span>
                <span className="magic-doc__meta">{d.meta}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="magic-static__results">
          {results.map((r, i) => (
            <div className={cn('magic-result__inner', `magic-result--${toneOf(r, i)}`)} key={r.id ?? i}>
              <span
                className="magic-result__pill"
                style={{ background: pillBackground(results.length > 1 ? i / (results.length - 1) : 0, i) }}
              >
                {r.label}
              </span>
              <span className="magic-result__body">{r.body}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div
      ref={stageRef}
      className={cn('magic-stage', classNames.root, className)}
      style={{
        height,
        width,
        background: backgroundColor,
        '--magic-axis': axisColor,
        '--magic-result-w': `${fan.w}px`,
        ...style,
      }}
      aria-hidden="true"
    >
      {/* 中轴 + 节拍闪光 */}
      <div className={cn('magic-axis', classNames.axis)} />
      <div className="magic-axis__flash" key={`flash-${beat}`} />

      {/* 文档流 */}
      {Array.from({ length: docSlots }, (_, k) => {
        const d = nth(k)
        const tone = toneOf(d, (activeIndex + k) % count)
        return (
          <div
            key={k}
            className={cn('magic-doc', classNames.document)}
            style={{ width: docW, height: docH }}
            ref={(el) => {
              docNodes.current[k] = el
            }}
          >
            <div className={cn('magic-doc__inner', `magic-doc__inner--${tone}`)} style={{ width: '100%', height: '100%' }}>
              <div className="magic-doc__media">
                {/* 官方文档卡上是一块像素化的码点阵，这里用同构的点阵图案 */}
                <span className="magic-doc__pixels" aria-hidden="true" />
                <span className="magic-doc__index">{d.index ?? String(((activeIndex + k) % count) + 1).padStart(2, '0')}</span>
                <span className="magic-doc__cat">{d.category}</span>
              </div>
              <div className="magic-doc__body">
                <span className="magic-doc__title">{d.title}</span>
                <span className="magic-doc__meta">{d.meta}</span>
              </div>
              {/* 被中轴吃掉时亮起的竖向光束（位置由 paint 写入的 CSS 变量决定） */}
              <span className="magic-doc__burn" aria-hidden="true" />
            </div>
          </div>
        )
      })}

      {/* 中轴中心块：key 变化即重放脉冲 */}
      <div
        className={cn('magic-center', classNames.center)}
        key={`center-${beat}`}
        style={{ width: centerSize, height: centerSize }}
      >
        {center}
      </div>

      {/* 结果卡：沿对角线扇形铺开。
          换拍的节奏是「旧的一批各自坠出舞台 → 换内容 → 新的一批从上方滑入」。
          不要用 React key 重挂来驱动：那会把光标跟随的弹簧一起清零，
          鼠标停住时药丸会每拍弹回中位。 */}
      {ppPills.length > 0 && (
        <ParallaxPills
          /* exitKey 一变 → 各枚依次向下坠出舞台；坠完回调 onReenter 换内容，
             随后子组件自动重放入场（也就是「新的一批落下来」）。 */
          exitKey={exitKey}
          onReenter={handleReenter}
          exitStagger={0.07}
          exitDuration={0.72}
          className={cn('magic-results', classNames.result)}
          width="100%"
          height={height}
          pills={ppPills}
          disableEmptyPills
          pillHeight={fan.h}
          pillRadius={12}
          fontSize={15}
          parallaxStrength={22}
          /* ---- 下面这组入场参数是**按本区块的几何反推**的，不是照抄官方默认值 ----
             entryDistance = 下落距离（药丸高度的百分比），见上面那段推导。
             官方默认 220 时第 1 枚会悬浮到舞台外，「悬浮」根本看不见。
             约束①：悬停位必须整张落在舞台内（含旋转外接框与铰链角度）→ 见 entryDistance 的推导。
             约束②：**不能有错峰**。只要 pill i+1 比 pill i 晚起跑，i 就会在落下途中
                     穿过 i+1 的悬停位。实测 entryStagger=0.08 时第 2、3 张重叠 37px
                     （将近半张卡）；而且用户上一轮明确要求「同时出」，错峰等于把它退回去。
                     所以 entryStagger=0 → 整把扇子一起悬停、一起落下，间距全程保持 8px。
             约束③：hingeAngle 也不能用官方的 18°。药丸绕中心旋转 θ 会把外接框高度
                     抬高 w·sinθ；18° 时多出 52px，上下各压邻居 22px。
                     压到 6° 时只有 18.8px，上下各 9.4px，与 8px 净间隙基本抵消。 */
          entryDistance={entryDistance}
          entryStagger={0}
          /* ---- 悬停时长置 0：落下必须是一段连续运动 ----
             之前这里给 0.18s，卡片滑到悬停位会**停死**，再靠弹簧重新加速往下落 ——
             「停下 → 重新启动」读起来是两段动画拼的（用户反馈：落下来的过程要自然连贯）。
             置 0 之后，领入段收尾时仍带着 ~250px/s 的向下速度，弹簧直接接住继续落，
             全程速度不归零。要回到「悬停一下再落」就把这个值改回 0.18。 */
          entryHold={0}
          /* ---- 领入段（刻意偏离 5）----
             新的一批**不能原地淡入**在悬停位上：那样出现的那一下没有位移，
             和前一段「旧的一批往下坠走」接不上，读起来就是「凭空冒出来」。
             现在整把扇子先整体上移到舞台上缘之外（靠舞台的 overflow 裁掉），
             再用 0.6s 缓入缓出滑到悬停位 —— 于是「出现」本身就是一段向下的位移，
             和坠落同向，两段接得上。
             0.6s 是按行程量出来的：最下面那张要走 maxTop+pillHeight+12 ≈ 452px
             （560 舞台、5 枚档），0.6s 下平均 754px/s、钻出上缘那一刻约 385px/s；
             换成缓出的话 t=0 就到 2700px/s，最下面那张是「嗖」一下窜进来的。 */
          entryLead={0.6}
          entryStiffness={140}
          entryDamping={11}
          hingeChance={0.5}
          hingeAngle={HINGE_ANGLE}
        />
      )}

      {/* 碎片：官方是带旋转的小方块，聚集在中轴与结果卡之间 */}
      {bursts.map((b) => (
        <div className={classNames.particle} key={b.key}>
          {b.points.map((pt) => (
            <span
              className="magic-particle"
              key={pt.i}
              style={{
                '--mp-tx': `${pt.tx.toFixed(1)}px`,
                '--mp-ty': `${pt.ty.toFixed(1)}px`,
                '--mp-rot': pt.rot,
                '--mp-dur': `${Math.round(pt.dur)}ms`,
                width: pt.size,
                height: pt.size,
                background: pillColor(pt.t),
              }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
