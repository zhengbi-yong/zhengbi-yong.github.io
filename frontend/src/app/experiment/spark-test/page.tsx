import GaussianSplat from '@/components/gaussian-splat/GaussianSplat'

export default function SparkTestPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="mb-2 text-3xl font-bold">Spark 2.0 — 3D Gaussian Splatting Demo</h1>
      <p className="mb-8 text-zinc-500">
        Powered by{' '}
        <a href="https://sparkjs.dev" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
          Spark 2.0
        </a>
        {' '}from{' '}
        <a href="https://www.worldlabs.ai" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
          World Labs
        </a>
      </p>

      <section className="mb-10">
        <h2 className="mb-2 text-xl font-semibold">Butterfly (~10K splats)</h2>
        <GaussianSplat
          url="https://sparkjs.dev/assets/splats/butterfly.spz"
          height={480}
          autoRotate={true}
          startPosition={[0, 0, -3]}
          lookAt={[0, 0, 0]}
        />
        <p className="mt-3 text-sm text-zinc-500">
          A small butterfly scan rendered with 3D Gaussian Splatting. Drag to rotate, scroll to zoom.
        </p>
      </section>

      <section className="mb-10 rounded-xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-700 dark:bg-zinc-800/50">
        <h3 className="mb-3 font-semibold">Component usage in MDX articles:</h3>
        <pre className="overflow-x-auto rounded-lg bg-zinc-900 p-4 text-sm text-green-400">
{`<GaussianSplat
  url="https://sparkjs.dev/assets/splats/butterfly.spz"
  height={480}
  autoRotate={true}
  startPosition={[0, 0, -3]}
/>`}
        </pre>
        <p className="mt-3 text-xs text-zinc-400">
          Drop the component into any MDX blog post. The module loads lazily — zero impact on initial page load.
        </p>
      </section>

      <section className="mb-10">
        <h3 className="mb-3 font-medium">Props</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-700">
                <th className="py-2 text-left font-medium">Prop</th>
                <th className="py-2 text-left font-medium">Default</th>
                <th className="py-2 text-left font-medium">Description</th>
              </tr>
            </thead>
            <tbody className="text-zinc-600 dark:text-zinc-400">
              <tr className="border-b border-zinc-100 dark:border-zinc-800">
                <td className="py-2 font-mono text-xs">url</td>
                <td className="py-2 font-mono text-xs">(required)</td>
                <td className="py-2">URL to .spz / .ply / .splat / .ksplat file</td>
              </tr>
              <tr className="border-b border-zinc-100 dark:border-zinc-800">
                <td className="py-2 font-mono text-xs">height</td>
                <td className="py-2 font-mono text-xs">480</td>
                <td className="py-2">Canvas height in pixels</td>
              </tr>
              <tr className="border-b border-zinc-100 dark:border-zinc-800">
                <td className="py-2 font-mono text-xs">autoRotate</td>
                <td className="py-2 font-mono text-xs">false</td>
                <td className="py-2">Auto-rotate the model</td>
              </tr>
              <tr className="border-b border-zinc-100 dark:border-zinc-800">
                <td className="py-2 font-mono text-xs">startPosition</td>
                <td className="py-2 font-mono text-xs">[0,0,-3]</td>
                <td className="py-2">Camera start position [x, y, z]</td>
              </tr>
              <tr className="border-b border-zinc-100 dark:border-zinc-800">
                <td className="py-2 font-mono text-xs">lookAt</td>
                <td className="py-2 font-mono text-xs">[0,0,0]</td>
                <td className="py-2">Camera look-at target [x, y, z]</td>
              </tr>
              <tr className="border-b border-zinc-100 dark:border-zinc-800">
                <td className="py-2 font-mono text-xs">fov</td>
                <td className="py-2 font-mono text-xs">60</td>
                <td className="py-2">Field of view in degrees</td>
              </tr>
              <tr>
                <td className="py-2 font-mono text-xs">splatScale</td>
                <td className="py-2 font-mono text-xs">1</td>
                <td className="py-2">Scale multiplier for the splat model</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}
