/** 顶部滚动进度条 */
export default function ScrollProgress({ ratio }) {
  return (
    <div
      className="scroll-progress"
      style={{ width: `${(ratio * 100).toFixed(2)}%` }}
    />
  )
}
