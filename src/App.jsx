import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase.js'

const CATEGORIES = [
  { id: 'lanches', label: 'Lanches' },
  { id: 'porcoes', label: 'Porções' },
  { id: 'bebidas', label: 'Bebidas' },
  { id: 'mousses', label: 'Mousses' },
]

const brl = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function ProductImage({ src, name, off }) {
  if (src) {
    return <img src={src} alt={name} loading="lazy" className={`h-24 w-24 shrink-0 rounded-xl object-cover ${off ? 'grayscale' : ''}`} />
  }
  return (
    <div className="grid h-24 w-24 shrink-0 place-items-center rounded-xl bg-brand-900 font-display text-3xl text-accent">
      {(name || '?').charAt(0)}
    </div>
  )
}

export default function App() {
  const [settings, setSettings] = useState({ name: 'Sem Frescura' })
  const [products, setProducts] = useState(null)
  const [error, setError] = useState(false)

  const load = useCallback(async () => {
    const [s, p] = await Promise.all([
      supabase.from('settings').select('*').eq('id', 1).maybeSingle(),
      supabase.from('products').select('*').order('sort').order('name'),
    ])
    if (p.error) return setError(true)
    setError(false)
    if (s.data) setSettings(s.data)
    setProducts(p.data || [])
  }, [])

  useEffect(() => {
    load()
    const onVisible = () => document.visibilityState === 'visible' && load()
    document.addEventListener('visibilitychange', onVisible)
    const t = setInterval(load, 60000) // atualiza sozinho a cada 1 min
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      clearInterval(t)
    }
  }, [load])

  useEffect(() => {
    document.title = `Cardápio · ${settings.name}`
  }, [settings.name])

  const sections = products
    ? CATEGORIES.map((c) => ({ ...c, list: products.filter((p) => p.category === c.id) })).filter((s) => s.list.length)
    : []

  return (
    <div className="min-h-screen">
      {/* Cabeçalho */}
      <header className="bg-brand-900 px-4 py-6 text-center">
        {settings.logo_url ? (
          <img src={settings.logo_url} alt={settings.name} className="mx-auto h-16 w-auto object-contain" />
        ) : (
          <h1 className="text-5xl text-cream">{settings.name}</h1>
        )}
        <p className="mt-2 font-display text-xl tracking-widest text-accent">Cardápio</p>
      </header>

      <main className="mx-auto max-w-3xl pb-10">
        {/* Atalhos das categorias */}
        {sections.length > 0 && (
          <div className="sticky top-0 z-30 bg-brand-800/95 px-4 py-3 backdrop-blur">
            <div className="flex gap-2 overflow-x-auto">
              {sections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' })}
                  className="shrink-0 cursor-pointer rounded-full border border-cream/40 px-4 py-1.5 font-display text-lg tracking-wide hover:bg-cream/10"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {!products && !error && <p className="p-10 text-center text-cream/70">Carregando cardápio…</p>}
        {error && (
          <div className="p-10 text-center">
            <p className="text-cream/80">Não foi possível carregar o cardápio agora.</p>
            <button onClick={load} className="mt-4 cursor-pointer rounded-xl bg-accent px-5 py-3 font-bold text-brand-950">
              Tentar novamente
            </button>
          </div>
        )}
        {products && sections.length === 0 && <p className="p-10 text-center text-cream/70">O cardápio está sendo montado. Volte em breve!</p>}

        {sections.map((s) => (
          <section key={s.id} id={s.id} className="scroll-mt-16 px-4 pt-6">
            <h2 className="mb-3 text-3xl text-accent">{s.label}</h2>
            <ul className="space-y-3">
              {s.list.map((p) => {
                const off = !p.available
                return (
                  <li key={p.id} className={`flex gap-3 rounded-2xl bg-brand-900/70 p-3 ${off ? 'opacity-70' : ''}`}>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <h3 className="text-xl leading-tight text-cream">{p.name}</h3>
                      {p.description && <p className="mt-1 text-sm leading-snug text-cream/70">{p.description}</p>}
                      <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                        <span className="font-display text-xl text-accent">{brl(p.price)}</span>
                        {off && (
                          <span className="rounded-full bg-black/40 px-3 py-1 text-xs font-bold tracking-wide text-cream/80 uppercase">
                            Indisponível
                          </span>
                        )}
                      </div>
                    </div>
                    <ProductImage src={p.image_url} name={p.name} off={off} />
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </main>

      {/* Rodapé */}
      <footer className="bg-brand-950 px-4 py-8 text-center">
        <p className="font-display text-2xl">{settings.name}</p>
      </footer>
    </div>
  )
}
