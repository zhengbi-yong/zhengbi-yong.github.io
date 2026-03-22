import SheetMusic from '@/components/SheetMusic'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ABC 记谱法测试',
  description: '测试 abcjs 乐谱渲染功能',
}

const exampleABC = `X:1
T:Cooley's
M:4/4
L:1/8
R:reel
K:Em
|:D2|EB{c}B A2FD|AGEF E2DB|ABcd AFEG|FAFD DFAc|
d2fd AFEG|FAFD DFAc|dBGB dAFG|EAFA ABcd:|
|:d2fd AFEG|FAFD DFAc|dBGB dAFG|EAFA ABcd:|
|:EAFA ABcd|dBGB dAFG|FAFD DFAc|d2fd AFEG:|
|4`

const simpleABC = `X:1
T:Simple Scale
M:4/4
K:C
C D E F | G A B c | c2 B2 | A2 G2 | F2 E2 | D2 C2 |]`

const irishABC = `X:1
T:Star of the County Down
M:4/4
L:1/8
K:Dm
FA A2 BA | F2 D2 D2 CD | EG G2 AG | F2 D2 D2 CD |
FA A2 BA | F2 D2 D2 FG | Ac dc Bc | d2 d2 d2 |]`

export default function TestABCPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-8 text-4xl font-bold">ABC 记谱法测试</h1>

      <div className="space-y-12">
        <section>
          <h2 className="mb-4 text-2xl font-semibold">示例 1: Cooley's Reel</h2>
          <p className="mb-4 text-gray-600 dark:text-gray-400">
            爱尔兰传统舞曲，展示完整的乐谱和播放控件。
          </p>
          <SheetMusic abcnotation={exampleABC} showPlayback />
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">示例 2: 简单音阶</h2>
          <p className="mb-4 text-gray-600 dark:text-gray-400">
            C 大调音阶示例。
          </p>
          <SheetMusic abcnotation={simpleABC} showPlayback />
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">示例 3: 星之郡县</h2>
          <p className="mb-4 text-gray-600 dark:text-gray-400">
            爱尔兰民谣。
          </p>
          <SheetMusic abcnotation={irishABC} showPlayback />
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">如何在 MDX 中使用</h2>
          <div className="rounded-lg bg-gray-900 p-4">
            <pre className="overflow-x-auto text-sm text-gray-100">
              <code>{`## 我的乐谱

\`\`\`abc
X:1
T:My Tune
M:4/4
K:C
C D E F | G A B c |]
\`\`\``}</code>
            </pre>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">功能特性</h2>
          <ul className="list-inside list-disc space-y-2 text-gray-600 dark:text-gray-400">
            <li>✅ 纯文本 ABC 记谱法，易于编辑</li>
            <li>✅ 自动渲染为 SVG 矢量图</li>
            <li>✅ 内置播放控件 (Web Audio API)</li>
            <li>✅ 响应式设计，自动缩放</li>
            <li>✅ 支持循环播放</li>
            <li>✅ 完美集成到 MDX 工作流</li>
          </ul>
        </section>
      </div>
    </div>
  )
}
