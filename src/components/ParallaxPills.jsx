import { useCallback, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { usePrefersReducedMotion } from '../hooks'

/**
 * Parallax Pills —— Bouncy labeled pills that drift along with your cursor
 * ------------------------------------------------------------------------
 * React Bits Starter `@reactbits-starter/parallax-pills-tw` 的**本地等效实现**。
 *
 * 为什么是复刻：`@reactbits-starter` 属付费层，未带 license key 时
 *   npx shadcn@latest add @reactbits-starter/parallax-pills-tw
 * 官方返回（实测原文）：
 *   Registry "@reactbits-starter" requires the following environment variables:
 *     • REACTBITS_LICENSE_KEY
 * 拿到密钥填入 portfolio/.env.local 后重跑上面那条命令即可用官方实现覆盖本文件，
 * **调用方无需改动**（除下面标注的两处刻意偏离）。
 *
 * props 与官方文档 https://pro.reactbits.dev/docs/components/parallax-pills 的
 * 21 项逐一对齐（名称/类型/默认值一致）。
 *
 * 刻意偏离（五处，均为适配本项目，官方文档里没有）：
 *   1. `entryHold`（默认 0.18s）—— 官方的入场是「从高处立刻开始下落」。
 *      曾有「**短暂悬浮后落下**」的要求，所以给每枚药丸留了一段静止悬停，
 *      悬停结束才开始弹落。但配上领入段（见偏离 5）之后它就是**死点**：
 *      卡片滑到悬停位速度归零、冻住，再靠弹簧重新加速往下落 ——
 *      「停下 → 重新启动」读起来是两段动画拼的（用户反馈：落下来的过程要自然连贯）。
 *      所以本区块传 **0**：领入段收尾时仍带着向下速度，弹簧接着这个速度继续落。
 *      置非 0 即回到「悬停一下再落」。
 *   2. pill item 支持可选 `body` / `opacity`。官方的药丸只有 `label`（单行居中）；
 *      本项目右侧要承载「项目详细」，所以带 body 的药丸会渲染成
 *      「左上角配色胶囊 + 1~2 行正文 + 底部灰条」的卡片形态。
 *      不带 body 的药丸仍是官方那种单行居中胶囊；`opacity` 用来下发扇形景深梯度。
 *   3. `entryKey`（默认 null）—— 这个值一变就重放一次入场，**但不重挂组件**。
 *      官方靠调用方换 React key 来重放；那样会把光标跟随的弹簧一并清零，
 *      于是「鼠标停住时药丸飘在一边，每拍刷新就自己弹回中位且不再动」。
 *      传 undefined（默认）即退回官方行为。
 *   4. `exitKey` / `exitStagger` / `exitDuration` / `onReenter` —— 「离场」能力，
 *      官方没有。`exitKey` 一变，各枚药丸就**依次向下坠出舞台**（同一套 t² 采样，
 *      越掉越快），等最后一枚落完自动重放一次入场，并在重放前回调 `onReenter`，
 *      让调用方在这一刻换内容。
 *      为什么需要它：入场动画的淡入延迟等于 `entryHold` 且 `from{opacity:0}`，
 *      所以每拍开头整批药丸有 ~180ms 是 opacity 0 —— 右侧看起来「空了一下」
 *      （实测换拍后 181ms 空白窗）。让旧的一批先坠下去，这段空档就被运动填满了。
 *      两个参数是量出来的：
 *        · 各枚掉**同样的距离**（= height + pillHeight），也就是同样的加速度；
 *          按「各自刚好被裁走」给不同距离的话，下落快的会追上慢的，叠成一坨。
 *        · 错开顺序**从下往上**（最下面那张先走），间距只会拉开不会收拢；
 *          反过来最上面那张会一路追上下面三张。
 *      换拍时刻 = 最后一枚「顶边越出舞台下缘」的时刻（t = √(need/dist)·dur），
 *      不是动画整段跑完的时刻 —— 尾巴那一段已经看不见，白等就是空窗。
 *   5. `entryLead`（默认 0，即官方行为：直接出现在悬停位）—— 「领入段」。
 *      官方（以及偏离 1 的悬停版）里新的一批是**原地淡入**在悬停位上的，
 *      出现的那一下没有任何位移，和前一段「旧的一批往下坠走」接不上，
 *      读起来就是「凭空冒出来」（用户反馈：掉落和出现要衔接自然）。
 *      做法：整把扇子先整体上移到**舞台上缘之上**（靠 overflow 裁掉，不是靠透明度），
 *      再用一段缓入缓出滑到各自的悬停位，然后才悬停、落下。
 *      于是「出现」本身就是一段**向下**的位移，方向和坠落一致，两段运动接得上。
 *      两个参数也是量出来的：
 *        · 起点必须让**最下面那张**也完全在上缘之上，所以整把扇子是**刚性平移**
 *          （各枚位移相同、保持扇形），不能各枚各自贴着上缘摆 —— 那样最下面那张
 *          要跑完全程而最上面那张只跑几十像素，同一时长下速度差 4 倍，像在发牌。
 *        · 缓动是一条**两端斜率都被钉住的三次曲线**（见 LEAD_IN / LEAD_OUT）：
 *          起步斜率 > 0 —— 纯 smoothstep 起步太肉，最下面那张要 ~60ms 才爬过上缘，
 *          那一段右侧是空的（实测 65~95ms）。
 *          **收尾斜率也必须 > 0（本轮的关键）** —— 收尾斜率 = 0 意味着滑到悬停位
 *          刚好停死，后面再启动就是「两段动画」。现在收尾仍带 ~250px/s 向下速度，
 *          由弹簧接住、减速、轻微回弹，全程速度不归零。
 *          全程导数恒 > 0（不回头），峰值速度约 800px/s，比收尾归零那版还略低。
 *      顺带：有领入段时淡入延迟归 0 —— 卡片是靠上缘裁出来的，不再需要淡入遮丑，
 *      而且淡入只覆盖前 260ms，那时卡片还在上缘之外。
 *
 * 物理：半隐式欧拉积分，固定步长 1/60s（累加器 + 最多 4 次补步，防止切后台后炸开）。
 *   入场弹簧 k=entryStiffness / c=entryDamping（欠阻尼 → 有回弹过冲）
 *   跟随弹簧 k=parallaxStiffness / c=parallaxDamping（约 1.16 → 平滑不抖）
 *   离场用 CSS keyframes 的 t² 采样（不是弹簧：坠落要单调加速，不能回弹）
 */

const BRAND = (t) => `color-mix(in hsl, var(--volt) ${t}%, var(--accent))`

/* ---- 领入段的位置曲线（刻意偏离 5）----
   归一化 u∈[0,1] → 已完成进度 e，三次多项式 e(u) = a·u + b·u² + c·u³，
   两端的**斜率**（= 归一化速度）被钉成常量，平均值恒为 1（e(1)=1）：
     LEAD_IN  = 0.25 —— 起步就带速度。用两端斜率都是 0 的 smoothstep 时，
                最下面那枚要 ~60ms 才爬过上缘，那段右侧是空的（实测 65~95ms）。
     LEAD_OUT = 0.42 —— 收尾**仍带向下速度**。这一项是本轮的关键：
                收尾斜率 0 意味着滑到悬停位刚好停死，之后再靠弹簧重新加速下落，
                「停下 → 重新启动」读起来就是两段动画拼起来的（用户反馈：
                落下来的过程要自然连贯）。现在收尾时仍带着约 250px/s，
                由弹簧直接接住、继续减速、轻微回弹，全程速度不归零。
   b、c 由「两端斜率 + e(1)=1」解出（b = 3−2a−out，c = out−2+a），
   改斜率时不必手算；全程导数恒 > 0（两端 0.25 / 0.42，中间是抛物线峰），不会回头。 */
const LEAD_IN = 0.25
const LEAD_OUT = 0.42
const LEAD_B = 3 - 2 * LEAD_IN - LEAD_OUT
const LEAD_C = LEAD_OUT - 2 + LEAD_IN
const leadEase = (u) => (LEAD_IN + (LEAD_B + LEAD_C * u) * u) * u

/** 官方默认 5 枚。这里用品牌双色域采样（官方用的是自己的一套示例色）。 */
export const DEFAULT_PILLS = [
  { label: 'Design', x: 6, y: 14, width: 22, rotate: -5, parallax: 1, background: BRAND(0), color: '#0b0a0c' },
  { label: 'Motion', x: 33, y: 6, width: 20, rotate: 3, parallax: 0.85, background: BRAND(25), color: '#0b0a0c' },
  { label: 'Systems', x: 58, y: 20, width: 24, rotate: -3, parallax: 0.7, background: BRAND(50), color: '#0b0a0c' },
  { label: 'Frontend', x: 12, y: 46, width: 26, rotate: 4, parallax: 0.9, background: BRAND(75), color: '#0b0a0c' },
  { label: 'Detail', x: 48, y: 58, width: 22, rotate: -4, parallax: 0.6, background: BRAND(100), color: '#0b0a0c' },
]

/** 官方默认 6 枚无标签装饰药丸（depth 层，跟随幅度更小）。 */
export const DEFAULT_BACKGROUND_PILLS = [
  { x: 4, y: 62, width: 18, parallax: 0.35, background: 'rgba(247,242,234,0.05)' },
  { x: 26, y: 30, width: 14, parallax: 0.3, background: 'rgba(247,242,234,0.04)' },
  { x: 44, y: 74, width: 20, parallax: 0.25, background: 'rgba(247,242,234,0.05)' },
  { x: 62, y: 44, width: 16, parallax: 0.4, background: 'rgba(247,242,234,0.04)' },
  { x: 74, y: 12, width: 18, parallax: 0.2, background: 'rgba(247,242,234,0.05)' },
  { x: 68, y: 78, width: 14, parallax: 0.32, background: 'rgba(247,242,234,0.04)' },
]

/** 半隐式欧拉一步。直接改 s 上的字段，避免每帧分配数组。 */
function springStep(s, xKey, vKey, target, dt, k, c) {
  const a = -k * (s[xKey] - target) - c * s[vKey]
  const nv = s[vKey] + a * dt
  s[vKey] = nv
  s[xKey] += nv * dt
}

export default function ParallaxPills({
  pills = DEFAULT_PILLS,
  backgroundPills = DEFAULT_BACKGROUND_PILLS,
  width = '100%',
  height = 480,
  className = '',
  pillRadius = 18,
  pillHeight = 64,
  fontSize = 18,
  fontWeight = 500,
  parallaxStrength = 24,
  disableParallax = false,
  disableEmptyPills = true,
  disableEntry = false,
  entryStagger = 0.08,
  entryStiffness = 140,
  entryDamping = 11,
  entryDistance = 220,
  hingeChance = 0.5,
  hingeAngle = 18,
  parallaxStiffness = 60,
  parallaxDamping = 18,
  /* ↓↓ 非官方，见文件头「刻意偏离 1」：悬停多久才开始下落（秒） */
  entryHold = 0.18,
  /* ↓↓ 非官方，见文件头「刻意偏离 5」：领入段时长（秒）。
     0 = 官方行为（直接出现在悬停位）；> 0 时整把扇子先从上缘之上滑进来。 */
  entryLead = 0,
  /* ↓↓ 非官方，见文件头「刻意偏离 3」：这个值一变就**重放入场**（不重挂组件）。
     用 React key 重挂也能重放入场，但会把光标跟随的弹簧一起清零 ——
     表现是「鼠标停住时药丸飘在一边，每 4 秒自己弹回中位且不再动」。 */
  entryKey = null,
  /* ↓↓ 非官方，见文件头「刻意偏离 4」：离场（依次向下坠出舞台） */
  exitKey = null,
  exitStagger = 0.06,
  exitDuration = 0.72,
  /** 坠完、重放入场**之前**回调 —— 调用方在这一刻换内容，
      这样「掉下去的」和「落下来的」是两批不同的卡片。 */
  onReenter,
  style,
}) {
  const reduceMotion = usePrefersReducedMotion()
  /* 减少动态效果时官方语义上应静止：不做入场、不做跟随 */
  const noEntry = disableEntry || reduceMotion
  const noParallax = disableParallax || reduceMotion

  const rootRef = useRef(null)
  const nodesRef = useRef([])
  const stateRef = useRef([])
  const targetRef = useRef({ x: 0, y: 0 })
  const rafRef = useRef(0)
  const t0Ref = useRef(null)
  const lastRef = useRef(0)
  const accRef = useRef(0)

  const showBg = !disableEmptyPills
  const items = showBg ? [...backgroundPills.map((p) => ({ ...p, __bg: true })), ...pills] : pills

  /* 悬停位：静止位 − entryDistance% × 药丸高 */
  const hoverY = noEntry ? 0 : -(entryDistance / 100) * pillHeight

  /* ---- 领入段的起点（刻意偏离 5；entryLead > 0 时启用）----
     官方的入场是「直接出现在悬停位、再落下」，也就是**原地淡入** ——
     出现的那一下没有任何位移，和前一段「旧的一批往下坠走」接不上，
     读起来就是「凭空冒出来」（用户反馈：掉落和出现要衔接自然）。
     现在让整把扇子先整体上移到**容器上缘之上**，靠 overflow 裁掉（不是靠透明度），
     再滑到各自的悬停位，然后才悬停、落下。「出现」本身就成了向下的一段位移。

     起点取**刚性平移**（所有枚同一个 offset）：必须让**最下面那枚**也完全在上缘之外，
     也就是 offset = −(maxTop + pillHeight + 2)。余量只留 2px 是量出来的：
     旋转后的外接框本来就会比盒子低 0~12px（铰链角度是随机的），
     再往上抬没意义 —— 那 12px 的「露头」由淡入（起始 opacity 0）盖住，看不见。
     留 12px 时最下面那枚要先用 ~60ms 才爬过上缘，那段右侧是空的。
     不能让各枚各自贴着上缘摆（offset_i = −(top_i + pillHeight + 2)）：
     那样最下面那枚要跑 maxTop + 药丸高 而最上面那枚只跑 minTop + 药丸高，
     同一时长下速度差到 4 倍（368px vs 116px），看起来像在发牌，
     而不是一整把扇子落下来。 */
  let leadFrom = hoverY
  if (!noEntry && entryLead > 0) {
    let maxTop = 0
    for (let i = 0; i < items.length; i++) {
      const t = (Number(items[i].y) / 100) * height
      if (t > maxTop) maxTop = t
    }
    leadFrom = -(maxTop + pillHeight + 2)
  }

  /** 一枚的入场相关字段（initState 与重放共用，避免两处写重复逻辑） */
  const entryFields = useCallback((p, order) => ({
    eY: leadFrom,
    eV: 0,
    lead: noEntry ? 0 : entryLead,
    leadFrom,
    /* 领入段**收尾时的向下速度**（px/s）。领入段结束时不是停住，而是带着这个速度
       交给弹簧 —— 弹簧接着它继续往下走、减速、回弹，所以整段落下是连续的。
       归一化收尾斜率 × 领入段的平均速度。entryHold > 0（真要悬停）时这个速度会在
       悬停那一刻被清成 0，见 tick 里的说明。 */
    leadV: noEntry || entryLead <= 0 ? 0 : (LEAD_OUT * (hoverY - leadFrom)) / entryLead,
    // 领入段 → 悬停 → 才开始下落。装饰层先落，前景按顺序错开
    delay: noEntry ? 0 : entryLead + entryHold + order * entryStagger,
    /* 淡入动画的延迟。有领入段时归 0 —— 卡片是靠上缘裁出来的，不需要淡入遮丑，
       而淡入只有 260ms，那会儿卡片还在上缘之外，留延迟反而整段滑行都看不见。
       （没有领入段时才走「下落延迟 − entryHold」那套，让悬停那段也可见。） */
    fade: noEntry || entryLead > 0 ? 0 : order * entryStagger,
  }), [leadFrom, hoverY, noEntry, entryLead, entryHold, entryStagger])

  /* 每枚药丸的初始状态。挂载时算一次即可 —— 想重放入场就换 React key 重挂。 */
  const initState = useCallback(() => {
    let fg = 0
    return items.map((p) => {
      const isBg = !!p.__bg
      const order = isBg ? 0 : fg++
      /* 铰链：随机决定「哪一头更沉」，初始倾角来自 hingeAngle，之后弹回静止角度 */
      const hinged = !noEntry && Math.random() < hingeChance
      return {
        ...entryFields(p, order),
        dRot: hinged ? (Math.random() < 0.5 ? -1 : 1) * hingeAngle : 0,
        dRotV: 0,
        pX: 0, pVX: 0,
        pY: 0, pVY: 0,
      }
    })
  }, [items, noEntry, hingeChance, hingeAngle, entryFields])

  stateRef.current = stateRef.current.length === items.length ? stateRef.current : initState()

  const write = useCallback(() => {
    const nodes = nodesRef.current
    const st = stateRef.current
    for (let i = 0; i < nodes.length; i++) {
      const el = nodes[i]
      const s = st[i]
      if (!el || !s) continue
      const base = items[i].rotate || 0
      el.style.transform =
        `translate3d(${s.pX.toFixed(2)}px, ${(s.eY + s.pY).toFixed(2)}px, 0) rotate(${(base + s.dRot).toFixed(2)}deg)`
    }
  }, [items])

  const tick = useCallback((now) => {
    const st = stateRef.current
    if (t0Ref.current == null) { t0Ref.current = now; lastRef.current = now }
    const elapsed = (now - t0Ref.current) / 1000
    let dt = (now - lastRef.current) / 1000
    lastRef.current = now
    if (dt > 0.25) dt = 0.25 // 切后台回来别一次性补一大步
    accRef.current += dt

    const FIXED = 1 / 60
    let steps = Math.min(Math.floor(accRef.current / FIXED), 4)
    accRef.current -= steps * FIXED
    if (steps === 0) { rafRef.current = requestAnimationFrame(tick); return }

    let busy = false
    for (let i = 0; i < st.length; i++) {
      const s = st[i]
      const p = items[i]
      /* 领入段（刻意偏离 5）：从上缘之上滑到悬停位。
         用**解析式曲线**而不是弹簧：总行程接近一整个舞台高（560 舞台约 440px），
         弹簧要么起手就冲到峰值速度、要么到点还带着残余速度把悬停位顶偏、
         要么收敛不到精确值（指数尾巴）；解析式到点**精确**落在悬停位，
         而且末端速度为 0 —— 后面交给弹簧接管时初速度为 0，交接是干净的。
         ⚠️ 这个分支必须在 elapsed < s.delay 时才生效：越过 delay 之后下落由弹簧接管，
         这里再钉一次 hoverY 就会把下落中的位移每帧打回悬停位（落不下去）。 */
      if (s.lead > 0 && elapsed < s.delay) {
        if (elapsed < s.lead) {
          s.eY = s.leadFrom + (hoverY - s.leadFrom) * leadEase(elapsed / s.lead)
          /* 把收尾速度写进 eV —— 领入段结束的那一帧，弹簧就从这个速度接着往下走。
             **不要**在这里把 eV 清 0：那等于让卡片在悬停位停死再重新启动，
             读起来是两段动画（见 LEAD_OUT 的说明）。 */
          s.eV = s.leadV
        } else {
          /* 走到这里说明 entryHold > 0（真的要悬停一下）：此时才是停车。 */
          s.eY = hoverY
          s.eV = 0
        }
      }
      if (elapsed >= s.delay) {
        springStep(s, 'eY', 'eV', 0, FIXED * steps, entryStiffness, entryDamping)
        springStep(s, 'dRot', 'dRotV', 0, FIXED * steps, entryStiffness, entryDamping)
      }
      const mult = typeof p.parallax === 'number' ? p.parallax : 1
      const tx = targetRef.current.x * mult
      const ty = targetRef.current.y * mult
      springStep(s, 'pX', 'pVX', tx, FIXED * steps, parallaxStiffness, parallaxDamping)
      springStep(s, 'pY', 'pVY', ty, FIXED * steps, parallaxStiffness, parallaxDamping)

      if (
        Math.abs(s.eY) > 0.05 || Math.abs(s.eV) > 0.05 ||
        Math.abs(s.dRot) > 0.02 || Math.abs(s.dRotV) > 0.02 ||
        Math.abs(s.pX - tx) > 0.05 || Math.abs(s.pVX) > 0.05 ||
        Math.abs(s.pY - ty) > 0.05 || Math.abs(s.pVY) > 0.05
      ) busy = true
    }
    write()

    /* 全静止就停掉 rAF —— 页面里还有文档流的 rAF 在跑，别白占一帧预算。
       下次 pointermove 会再把循环拉起来。 */
    if (busy) rafRef.current = requestAnimationFrame(tick)
    else rafRef.current = 0
  }, [items, write, hoverY, entryStiffness, entryDamping, parallaxStiffness, parallaxDamping])

  const ensureLoop = useCallback(() => {
    if (rafRef.current) return
    lastRef.current = performance.now()
    rafRef.current = requestAnimationFrame(tick)
  }, [tick])

  /* ⚠️ 关键：initState / write / ensureLoop 全都依赖 items，而 items 每次渲染都是新数组。
     把它们直接写进 effect 依赖，effect 就会**每次渲染都重跑**，于是
     `stateRef.current = initState()` 把 pX/pY（光标跟随位移）打回 0，
     而 targetRef（光标目标）还在 —— 表现是「鼠标停住不动，药丸每隔一两秒
     突然掉回中位、再慢慢飘回光标那侧」（实测 18.5px → 2.6px → 18.5px）。
     塌陷发生在**任何一次重渲染**（换拍、内容替换都会触发），所以看起来没规律。
     解法：用 ref 取「最新一份」回调，effect 依赖只留真正的语义开关。 */

  /** 重放入场。**只重置入场相关字段**，pX/pY（跟随位移）与 targetRef（光标目标）
      都原样保留 —— 否则每拍刷新都会把光标漂移打回原点。
      元素没有重挂，CSS 淡入动画不会自动重来，要手动 cancel+play 一次。 */
  const replayEntry = useCallback(() => {
    const st = stateRef.current
    let fg = 0
    items.forEach((p, i) => {
      const s = st[i]
      if (!s) return
      const isBg = !!p.__bg
      const order = isBg ? 0 : fg++
      const hinged = !noEntry && Math.random() < hingeChance
      // 入场字段整套重来（含领入段），pX/pY（跟随位移）保留
      Object.assign(s, entryFields(p, order))
      s.dRot = hinged ? (Math.random() < 0.5 ? -1 : 1) * hingeAngle : 0
      s.dRotV = 0
    })
    nodesRef.current.forEach((el, i) => {
      const s = st[i]
      if (!el || !s) return
      // 先摘掉离场类：否则它的 animation 简写会顶掉 pp-fade，淡入重放不起来
      el.classList.remove('parallax-pill--out')
      el.style.animationDelay = `${s.fade.toFixed(3)}s`
      const a = el.getAnimations ? el.getAnimations().find((x) => x.animationName === 'pp-fade') : null
      if (a) { a.cancel(); a.play() }
    })
    // 让 tick 从这一刻重新计时（悬停时长按新的一拍算）
    t0Ref.current = null
    accRef.current = 0
    write()
    ensureLoop()
  }, [items, noEntry, hingeChance, hingeAngle, entryFields, write, ensureLoop])

  const latest = useRef(null)
  latest.current = { initState, write, ensureLoop, replayEntry }

  useEffect(() => {
    t0Ref.current = null
    accRef.current = 0
    stateRef.current = latest.current.initState()
    latest.current.write()
    if (noEntry) return
    latest.current.ensureLoop()
    return () => { if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = 0 } }
  }, [noEntry])

  /* 重放入场（entryKey 变化时）。离场完成后的那次重放走的是 playExit 里的定时器。 */
  const entryKeyRef = useRef(entryKey)
  useEffect(() => {
    if (entryKeyRef.current === entryKey) return
    entryKeyRef.current = entryKey
    latest.current.replayEntry()
  }, [entryKey])

  /* 离场：各枚药丸**依次向下坠出舞台**。
     坠落全程只是把旧的一批移走，所以右侧不会再出现「整块空掉」的一帧；
     最后一枚落完再重放入场（并在重放前回调 onReenter 让调用方换内容）。
     坠落用 CSS 的 t² 采样而不是弹簧：坠落必须单调加速，不能回弹。 */
  const exitKeyRef = useRef(exitKey)
  const exitTimerRef = useRef(0)
  useEffect(() => {
    if (exitKeyRef.current === exitKey) return
    exitKeyRef.current = exitKey
    /* 降级路径（prefers-reduced-motion / disableEntry）：不做动画，直接换内容 */
    if (noEntry) { onReenter?.(); return }

    const st = stateRef.current
    const nodes = nodesRef.current
    const fgCount = items.filter((p) => !p.__bg).length
    /* 所有卡片掉**同样的距离** —— 也就是同样的加速度，物理上一致。
       别改成「各自掉到自己刚好被裁走」那种按需距离：距离不同 → 下落快的会追上慢的，
       实测会叠成一坨、标签互相压住，读不出内容。 */
    const dist = height + pillHeight
    let lastClip = 0
    let fg = 0
    items.forEach((p, i) => {
      const el = nodes[i]
      const s = st[i]
      if (!el || !s) return
      const isBg = !!p.__bg
      const k = isBg ? 0 : fg++
      /* 错开顺序是**从下往上**（最下面那张先离场）。
         反过来的话最上面那张会一路追上下面三张、叠成一堆（实测过）。
         语义上也顺：扇形最下面的那张是最早出来的成果，先走。 */
      const delay = (isBg ? 0 : fgCount - 1 - k) * exitStagger
      /* 「它完全掉出舞台」的时刻：位移达到 height − top 时顶边已越过下缘
         （+12 是旋转后的外接框余量：卡片带 6~7° 旋转，外接框顶边比盒顶边高约 10px）。
         t² 采样下 位移 ∝ t²，所以 t = √(need / dist)。
         换拍就排在这个时刻，不必等动画整段跑完 —— 跑完的那段尾巴已经看不见了，
         白等只会留出一段空窗（这正是最早那版 86ms 空白的来源）。 */
      const top = (Number(p.y) / 100) * height
      const need = Math.max(0, height - top + 12)
      const clipAt = delay + Math.sqrt(Math.min(1, need / dist)) * exitDuration
      el.style.setProperty('--pp-out-dist', `${dist.toFixed(1)}px`)
      el.style.setProperty('--pp-out-dur', `${exitDuration.toFixed(3)}s`)
      // 离场类用的是自己的 animation 简写，延迟只能走 inline（React 只在值变化时才覆写）
      el.style.animationDelay = `${delay.toFixed(3)}s`
      el.classList.add('parallax-pill--out')
      lastClip = Math.max(lastClip, clipAt)
    })

    if (!nodes.length) { onReenter?.(); return }

    /* +20ms 余量：动画按 60fps 推进，判定时刻附近还差一帧才算完全越出下缘 */
    const total = (lastClip + 0.02) * 1000
    exitTimerRef.current = setTimeout(() => {
      exitTimerRef.current = 0
      onReenter?.()
      latest.current.replayEntry()
    }, total)
    return () => { if (exitTimerRef.current) { clearTimeout(exitTimerRef.current); exitTimerRef.current = 0 } }
    /* 依赖只有 exitKey / noEntry 两个「语义开关」——
       千万别把 items、onReenter 这类每次渲染都换引用的东西写进来：
       effect 每次渲染都会重跑，虽然守卫会挡住函数体，但**清理函数照样会执行**，
       于是刚排好的坠落定时器每次渲染都被 clearTimeout 掉，离场永远走不完。 */
  }, [exitKey, noEntry])

  /* 光标跟随：只在指针**进入容器**时生效，离开就弹回原位。
     容器外的鼠标移动不参与 —— 用户要的是「鼠标移到上面时」才动。 */
  useEffect(() => {
    if (noParallax) return
    const el = rootRef.current
    if (!el) return
    const onMove = (e) => {
      const r = el.getBoundingClientRect()
      if (!r.width || !r.height) return
      const nx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1))
      const ny = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1))
      targetRef.current = { x: nx * parallaxStrength, y: ny * parallaxStrength * 0.6 }
      ensureLoop()
    }
    /* 指针离开 → 弹回原位。但 **pointerleave 会因布局/重绘被误触发**
       （每拍重放入场时药丸位置变了，Chrome 会重跑命中测试，
       指针明明还在容器里也会收到一个 leave）。
       不加这层判断的话，表现是「鼠标停住不动，药丸每隔几秒自己慢慢飘回中位」。
       用事件的 clientX/Y 复核一下：还在容器矩形内就当作假 leave 忽略。 */
    const onLeave = (e) => {
      const r = el.getBoundingClientRect()
      const inside =
        e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom
      if (inside) return
      targetRef.current = { x: 0, y: 0 }
      latest.current.ensureLoop()
    }
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerleave', onLeave)
    return () => {
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
    }
  }, [noParallax, parallaxStrength])

  const boxStyle = (p) => ({
    left: `${p.x}%`,
    top: `${p.y}%`,
    width: `${p.width}%`,
    height: pillHeight,
    borderRadius: pillRadius,
    fontSize,
    fontWeight,
    background: p.background,
    color: p.color || 'var(--text)',
    /* 也是刻意偏离 2 的一部分：药丸可带 opacity（默认 1）。
       淡入动画的终点读这个变量，这样扇形的景深梯度才不会被动画覆盖成 1。 */
    '--pp-op': typeof p.opacity === 'number' ? p.opacity : 1,
  })

  return (
    <div
      ref={rootRef}
      className={cn('parallax-pills', className)}
      style={{ width, height, '--pp-pill-h': `${pillHeight}px`, ...style }}
    >
      {items.map((p, i) => (
        <div
          key={i}
          ref={(el) => { nodesRef.current[i] = el }}
          className={cn(
            'parallax-pill',
            p.__bg && 'parallax-pill--bg',
            !p.body && 'parallax-pill--label',
          )}
          style={{
            ...boxStyle(p),
            /* 淡入延迟见 entryFields.fade：有领入段时归 0 —— 卡片是靠上缘裁出来的，
               不需要淡入遮丑，而淡入只有 260ms，那会儿它们还在上缘之外。 */
            animationDelay: `${(stateRef.current[i]?.fade ?? 0).toFixed(3)}s`,
            /* 首帧必须落在**领入段的起点**上。这里若写成悬停位，挂载后会先看到
               一帧悬停、再跳到上缘之外开始下滑（useEffect 在 paint 之后才跑）。
               值恒为 leadFrom（不随帧变化），所以 React 只在首次提交时写这一回，
               之后由 write() 逐帧接管，两边不会互相打架。 */
            transform: noEntry
              ? 'none'
              : `translate3d(0px, ${leadFrom.toFixed(2)}px, 0) rotate(${(p.rotate || 0).toFixed(2)}deg)`,
          }}
        >
          {p.__bg ? null : p.body ? (
            <>
              <span className="parallax-pill__tag" style={{ background: p.tagColor || p.background }}>
                {p.label}
              </span>
              <span className="parallax-pill__body">{p.body}</span>
              <span className="parallax-pill__rule" aria-hidden="true" />
            </>
          ) : (
            p.label
          )}
        </div>
      ))}
    </div>
  )
}
