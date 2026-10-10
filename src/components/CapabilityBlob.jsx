/**
 * Bento 卡片右下角的有机装饰图形
 * @param {string} variant - gradient-star | circles | orbit | hexagon | spiral
 * @param {string} uid     - 渐变 id 前缀，保证同页多处不冲突
 *
 * 配色：严格双色 —— 仅用绯红系与电青系（及其明度衍生），
 * 取值与 global.css 的 --accent / --volt 体系一致；
 * 白亮高光取中性色（等同 --text），不计作强调色。
 */
const CRIMSON = '#ff2d55'
const CRIMSON_SOFT = '#ff5c7d'
const CRIMSON_DEEP = '#c00f38'
const CRIMSON_DARK = '#6b1330'
const CRIMSON_VOID = '#2a1418'

const CYAN = '#21e6ff'
const CYAN_SOFT = '#7df0ff'
const CYAN_DEEP = '#0fb6d6'
const CYAN_MID = '#0d5a6b'
const CYAN_VOID = '#0a1418'
const CYAN_DARK = '#0e3a44'

const HIGHLIGHT = '#f7f2ea'

export default function CapabilityBlob({ variant, uid }) {
  switch (variant) {
    case 'circles':
      return (
        <svg className="bento__blob" viewBox="0 0 200 200" aria-hidden="true">
          <defs>
            <radialGradient id={`${uid}-grad`} cx="35%" cy="30%" r="80%">
              <stop offset="0%" stopColor={CRIMSON_SOFT} />
              <stop offset="60%" stopColor={CRIMSON_DEEP} />
              <stop offset="100%" stopColor={CRIMSON_VOID} />
            </radialGradient>
          </defs>
          <circle cx="80" cy="92" r="56" fill={`url(#${uid}-grad)`} opacity=".9" />
          <circle cx="132" cy="122" r="46" fill={CYAN} opacity=".45" />
          <circle cx="140" cy="66" r="26" fill={CRIMSON} opacity=".85" />
        </svg>
      )

    case 'orbit':
      return (
        <svg className="bento__blob" viewBox="0 0 200 200" aria-hidden="true">
          <defs>
            <radialGradient id={`${uid}-grad`} cx="35%" cy="30%" r="80%">
              <stop offset="0%" stopColor={CYAN_DEEP} />
              <stop offset="55%" stopColor={CYAN_MID} />
              <stop offset="100%" stopColor={CYAN_VOID} />
            </radialGradient>
          </defs>
          <circle cx="130" cy="92" r="36" fill={CYAN} opacity=".75" />
          <circle cx="102" cy="116" r="62" fill={`url(#${uid}-grad)`} />
          <circle cx="148" cy="64" r="19" fill="none" stroke={CRIMSON} strokeWidth="13" />
          <path d="M94 72l11 26 26 11-26 11-11 26-11-26-26-11 26-11z" fill={HIGHLIGHT} />
        </svg>
      )

    case 'hexagon':
      return (
        <svg className="bento__blob" viewBox="0 0 200 200" aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}-grad`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={CRIMSON} />
              <stop offset="100%" stopColor={CYAN} />
            </linearGradient>
          </defs>
          <path d="M100 34 L160 68 L160 132 L100 166 L40 132 L40 68 Z" fill={`url(#${uid}-grad)`} opacity=".9" />
          <path d="M100 34 L160 68 L100 102 L40 68 Z" fill={CYAN_SOFT} opacity=".95" />
          <path d="M40 68 L100 102 L100 166 L40 132 Z" fill={CRIMSON_DARK} opacity=".95" />
        </svg>
      )

    case 'spiral':
      return (
        <svg className="bento__blob" viewBox="0 0 200 200" aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}-grad`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={CRIMSON} />
              <stop offset="100%" stopColor={CYAN} />
            </linearGradient>
          </defs>
          <path
            d="M118 34 C158 44 176 84 168 122 C158 166 112 184 76 170 C44 158 32 122 46 96 C58 74 86 70 102 86 C114 98 112 118 98 124 C88 128 78 122 78 112"
            fill="none"
            stroke={`url(#${uid}-grad)`}
            strokeWidth="34"
            strokeLinecap="round"
            opacity=".9"
          />
        </svg>
      )

    case 'gradient-star':
    default:
      return (
        <svg className="bento__blob" viewBox="0 0 200 200" aria-hidden="true">
          <defs>
            <radialGradient id={`${uid}-grad`} cx="35%" cy="30%" r="80%">
              <stop offset="0%" stopColor={CRIMSON_SOFT} />
              <stop offset="55%" stopColor={CRIMSON_DEEP} />
              <stop offset="100%" stopColor={CYAN_DARK} />
            </radialGradient>
          </defs>
          <path
            d="M100 18 C140 8 178 40 182 84 C186 128 152 178 104 182 C56 186 20 148 18 100 C16 52 60 28 100 18 Z"
            fill={`url(#${uid}-grad)`}
            opacity=".92"
          />
          <path d="M100 52l14 34 34 14-34 14-14 34-14-34-34-14 34-14z" fill={HIGHLIGHT} opacity=".92" />
        </svg>
      )
  }
}
