import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import Reveal from '../Reveal'

/**
 * Features 6 —— 四张特性卡片 / 彩色渐变光斑 / 悬浮箭头强调
 * ---------------------------------------------------------
 * 本文件是 React Bits Pro `@reactbits-pro/features-6` 的**本地等效实现**
 * （官方注册表需要 license key，当前项目未配置，故按同等视觉规格、
 * 使用项目既有设计 token 复刻）。拿到密钥后可直接替换为官方区块：
 *   npx shadcn@latest add @reactbits-pro/features-6
 *
 * 视觉 token 全部取自双色 identity：
 *   绯红 --accent #ff2d55  /  电青 --volt #21e6ff
 */

/** 四套卡面变体，与 global.css 中 card__media--a/b/c/d 一一对应 */
export const FEATURE_VARIANTS = [
  {
    tone: 'hot',
    surface: 'linear-gradient(150deg, #2a1407, #0c0a0d)',
    blob: 'radial-gradient(120% 100% at 20% 0%, rgba(255,45,85,0.55), transparent 55%)',
  },
  {
    tone: 'cool',
    surface: 'linear-gradient(150deg, #06222a, #0a0c0e)',
    blob: 'radial-gradient(120% 100% at 80% 10%, rgba(33,230,255,0.42), transparent 55%)',
  },
  {
    tone: 'hot',
    surface: 'linear-gradient(150deg, #2a1407, #0c0a0d)',
    blob: 'radial-gradient(120% 100% at 30% 20%, rgba(255,45,85,0.45), transparent 55%)',
  },
  {
    tone: 'cool',
    surface: 'linear-gradient(150deg, #072028, #0a0c0e)',
    blob: 'radial-gradient(120% 100% at 70% 0%, rgba(33,230,255,0.38), transparent 55%)',
  },
]

/** 卡面栅格叠层：沿用 token 色，不引入新颜色 */
const GRID_OVERLAY = {
  backgroundImage:
    'linear-gradient(rgba(247,242,234,0.10) 1px, transparent 1px),' +
    'linear-gradient(90deg, rgba(247,242,234,0.10) 1px, transparent 1px)',
  backgroundSize: '40px 40px',
}

/**
 * 单张特性卡
 *
 * @param {object}  props
 * @param {object}  props.variant  卡面变体（FEATURE_VARIANTS 中的一项）
 * @param {string}  props.index    装饰序号，如 "01"
 * @param {string}  props.category 右上角胶囊标签
 * @param {string}  props.title    标题
 * @param {string}  props.desc     描述
 * @param {string}  props.meta     左下角元信息
 * @param {string} [props.action]  右下角行动文案
 */
export function FeatureCard({
  variant = FEATURE_VARIANTS[0],
  index,
  category,
  title,
  desc,
  meta,
  action = '查看',
}) {
  const isHot = variant.tone === 'hot'

  return (
    <article
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-[var(--r-lg)] border border-line bg-surface',
        'transition duration-500 ease-out-quint',
        'hover:-translate-y-1.5 hover:border-line-2 hover:shadow-[0_30px_70px_rgba(0,0,0,0.55)]'
      )}
    >
      {/* —— 卡面：渐变底 + 彩色光斑 + 栅格 —— */}
      <div className="relative flex h-[320px] shrink-0 items-end justify-between p-[26px]">
        <div className="absolute inset-0" style={{ background: variant.surface }} aria-hidden="true" />
        <div
          className="absolute inset-0 transition-transform duration-700 ease-out-quint group-hover:scale-[1.06]"
          style={{ background: variant.blob }}
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 opacity-[0.35] transition-transform duration-700 ease-out-quint group-hover:scale-[1.08]"
          style={GRID_OVERLAY}
          aria-hidden="true"
        />

        <span className="relative z-[1] font-display text-[64px] font-extrabold leading-none text-ink/[0.14]">
          {index}
        </span>

        <span
          className={cn(
            'relative z-[1] rounded-full border bg-[rgba(11,10,12,0.55)] px-3 py-1.5',
            'font-mono text-[11px] uppercase tracking-[0.12em] text-ink backdrop-blur-[6px]',
            isHot ? 'border-accent/40' : 'border-volt/40'
          )}
        >
          {category}
        </span>
      </div>

      {/* —— 卡片正文 —— */}
      <div className="flex flex-1 flex-col px-8 pb-[34px] pt-[30px]">
        <h3 className="font-display text-[24px] font-extrabold leading-snug tracking-[-0.01em] text-ink">
          {title}
        </h3>
        <p className="mb-[26px] mt-3.5 max-w-[460px] text-[16px] leading-[1.75] text-muted">{desc}</p>

        <div className="mt-auto flex items-center justify-between border-t border-line pt-[22px]">
          <span className="font-mono text-[12px] tracking-[0.04em] text-faint">{meta}</span>

          {/* 悬浮箭头强调 */}
          <span
            className={cn(
              'inline-flex items-center gap-2 font-mono text-[13px] font-bold',
              isHot ? 'text-accent' : 'text-volt'
            )}
          >
            {action}
            <ArrowRight
              className="size-[14px] transition-transform duration-300 ease-out-quint group-hover:translate-x-1"
              strokeWidth={2.5}
              aria-hidden="true"
            />
          </span>
        </div>
      </div>
    </article>
  )
}

/**
 * Features 6 区块本体
 *
 * @param {object}  props
 * @param {Array}   props.items  卡片数据（建议 4 条），字段见 FeatureCard
 * @param {string} [props.className]
 * @param {boolean}[props.reveal] 是否启用滚动错峰揭示（默认 true）
 */
export default function Features6({ items = [], className = '', reveal = true }) {
  return (
    <div className={cn('grid grid-cols-1 gap-8 min-[860px]:grid-cols-2', className)}>
      {items.map((item, i) => {
        const variant = FEATURE_VARIANTS[i % FEATURE_VARIANTS.length]
        const card = (
          <FeatureCard
            variant={variant}
            index={item.index ?? String(i + 1).padStart(2, '0')}
            category={item.category}
            title={item.title}
            desc={item.desc}
            meta={item.meta}
            action={item.action}
          />
        )

        if (!reveal) {
          return <div key={item.id ?? i}>{card}</div>
        }

        // 错峰揭示：.reveal 的 transition 简写会把 transition-delay 归零，
        // 因此用内联 style 覆盖（内联样式优先级高于任何层/选择器）
        return (
          <Reveal key={item.id ?? i} style={{ transitionDelay: `${i * 80}ms` }}>
            {card}
          </Reveal>
        )
      })}
    </div>
  )
}
