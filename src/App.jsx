import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from './supabase.js'

// Ordem do cardápio, frase de cada seção, cor do preço e foto de fundo.
// As fotos ficam em public/fundos/ (troque o arquivo para mudar a foto).
// "pos" escolhe qual parte da foto fica visível no celular.
const CATEGORIES = [
  { id: 'lanches', label: 'Lanches', tagline: 'Direto da chapa, sem enrolação', accent: '#f97316', glow: 'rgba(249,115,22,0.35)', scene: 'fundos/lanches.jpg', pos: '15% 50%' },
  { id: 'porcoes', label: 'Porções', tagline: 'Pra dividir (ou não)', accent: '#fbbf24', glow: 'rgba(251,191,36,0.3)', scene: 'fundos/porcoes.jpg', pos: '85% 50%' },
  { id: 'bebidas', label: 'Bebidas', tagline: 'Geladas do jeito certo', accent: '#22d3ee', glow: 'rgba(34,211,238,0.3)', scene: 'fundos/bebidas.jpg', pos: '20% 50%' },
  { id: 'mousses', label: 'Mousses', tagline: 'O final doce', accent: '#f9a8d4', glow: 'rgba(249,168,212,0.3)', scene: 'fundos/mousses.jpg', pos: '20% 50%' },
]

const brl = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const goTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

// Faz o card aparecer suavemente quando entra na tela
function useReveal() {
  const ref = useRef(null)
  const [on, setOn] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setOn(true)
          io.disconnect()
        }
      },
      { threshold: 0.1 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return [ref, on]
}

function Card({ p, accent }) {
  const [ref, on] = useReveal()
  const off = !p.available
  return (
    <li
      ref={ref}
      className={`overflow-hidden rounded-[22px] border border-white/10 bg-black/45 shadow-xl shadow-black/40 backdrop-blur-md transition duration-700 ease-out motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none ${
        on ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
      }`}
    >
      <div className="relative aspect-[3/2] bg-white/5">
        {p.image_url ? (
          <img src={p.image_url} alt={p.name} loading="lazy" className={`h-full w-full object-cover ${off ? 'grayscale' : ''}`} />
        ) : (
          <div className="grid h-full place-items-center font-script text-6xl" style={{ color: accent }}>
            {(p.name || '?').charAt(0)}
          </div>
        )}
        {off && (
          <span className="absolute top-3 left-3 rounded-full bg-black/75 px-3 py-1 text-[11px] font-extrabold tracking-wider text-white uppercase">
            Indisponível
          </span>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg leading-snug font-bold text-white">{p.name}</h3>
          <span className={`shrink-0 text-lg font-extrabold whitespace-nowrap ${off ? 'opacity-50' : ''}`} style={{ color: accent }}>
            {brl(p.price)}
          </span>
        </div>
        {p.description && <p className="mt-1.5 text-sm leading-relaxed text-white/60">{p.description}</p>}
      </div>
    </li>
  )
}

function Section({ cat, list }) {
  const [sceneOk, setSceneOk] = useState(true)
  // plano B (se a foto de public/fundos não existir): foto de um produto da categoria, desfocada
  const fallback = (list.find((p) => p.image_url && p.available) || list.find((p) => p.image_url))?.image_url

  return (
    <section id={cat.id} className="relative">
      {/* Fundo que fica parado enquanto você rola a categoria */}
      <div aria-hidden="true" className="scene-mask pointer-events-none sticky top-0 h-[100svh] w-full overflow-hidden">
        {sceneOk ? (
          <img
            src={`${import.meta.env.BASE_URL}${cat.scene}`}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setSceneOk(false)}
            className="h-full w-full object-cover"
            style={{ objectPosition: cat.pos }}
          />
        ) : (
          <>
            {fallback && <img src={fallback} alt="" className="h-full w-full scale-110 object-cover blur-sm brightness-50 saturate-125" />}
            <div className="absolute inset-0" style={{ background: `radial-gradient(120% 70% at 50% 25%, ${cat.glow}, transparent 60%)` }} />
          </>
        )}
        <div className={`absolute inset-0 bg-gradient-to-b ${sceneOk ? 'from-black/10 via-black/30 to-black/70' : 'from-black/40 via-black/55 to-black/80'}`} />
      </div>

      {/* Conteúdo por cima do fundo */}
      <div className="relative -mt-[100svh]">
        <header className="px-5 pt-[50svh] pb-[42svh] text-center">
          <p
            className="text-[11px] font-extrabold tracking-[0.32em] uppercase"
            style={{ color: cat.accent, textShadow: '0 1px 3px #000, 0 0 14px rgba(0,0,0,0.9)' }}
          >
            {cat.tagline}
          </p>
          <h2 className="mt-2 font-script text-6xl text-cream drop-shadow-[0_4px_18px_rgba(0,0,0,0.6)] sm:text-7xl">{cat.label}</h2>
        </header>

        <ul className="mx-auto grid max-w-md gap-5 px-5 pb-24 md:max-w-3xl md:grid-cols-2 lg:max-w-5xl lg:grid-cols-3">
          {list.map((p) => (
            <Card key={p.id} p={p} accent={cat.accent} />
          ))}
        </ul>
      </div>
    </section>
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

  const mapHref =
    settings.map_url ||
    (settings.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.address)}` : '')

  return (
    <div className="min-h-screen overflow-x-clip">
      {/* Abertura */}
      <header className="relative flex min-h-[100svh] flex-col items-center justify-center px-6 text-center">
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{ background: 'radial-gradient(80% 50% at 50% 100%, rgba(249,115,22,0.16), transparent 70%)' }}
        />
        <div className="relative flex flex-col items-center">
          {settings.logo_url ? (
            <img
              src={settings.logo_url}
              alt={settings.name}
              className="max-h-48 w-auto rounded-3xl object-contain shadow-[0_0_60px_rgba(249,115,22,0.22)]"
            />
          ) : (
            <p className="text-xs font-extrabold tracking-[0.35em] text-white/70 uppercase">{settings.name}</p>
          )}
          <h1 className="mt-6 font-script text-6xl text-cream sm:text-7xl">Cardápio</h1>
          <p className="mt-3 max-w-xs text-white/60">Comida de verdade, sem frescura.</p>
          <p className="mt-1 max-w-xs text-white/60">Role para ver.</p>
          {sections.length > 0 && (
            <nav className="mt-7 flex max-w-sm flex-wrap justify-center gap-2.5">
              {sections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => goTo(s.id)}
                  className="cursor-pointer rounded-full border border-white/25 px-4 py-1.5 text-sm font-bold text-white transition hover:bg-white/10"
                >
                  {s.label}
                </button>
              ))}
            </nav>
          )}
        </div>

        <button
          onClick={() => sections[0] && goTo(sections[0].id)}
          aria-label="Rolar para baixo"
          className="absolute bottom-8 animate-bounce cursor-pointer text-2xl text-white/50"
        >
          ↓
        </button>
      </header>

      {!products && !error && <p className="py-16 text-center text-white/60">Carregando cardápio…</p>}
      {error && (
        <div className="py-16 text-center">
          <p className="text-white/70">Não foi possível carregar o cardápio agora.</p>
          <button onClick={load} className="mt-4 cursor-pointer rounded-full border border-white/30 px-5 py-2 font-bold">
            Tentar novamente
          </button>
        </div>
      )}
      {products && sections.length === 0 && <p className="py-16 text-center text-white/60">O cardápio está sendo montado. Volte em breve!</p>}

      {sections.map((s) => (
        <Section key={s.id} cat={s} list={s.list} />
      ))}

      {/* Rodapé */}
      <footer className="px-6 pt-6 pb-12 text-center">
        {settings.logo_url && <img src={settings.logo_url} alt={settings.name} className="mx-auto h-24 w-auto rounded-2xl object-contain" />}
        <p className="mt-3 text-sm text-white/70">Bom apetite!</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">

          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="cursor-pointer rounded-full border border-white/25 px-5 py-2 text-sm font-bold text-white hover:bg-white/10"
          >
            Voltar ao topo ↑
          </button>
        </div>
      </footer>
    </div>
  )
}
