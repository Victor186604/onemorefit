import Image from 'next/image'

type Variante = 'colorida' | 'branca'

const LOGO = { colorida: '/brand/onemorefit-logo.png', branca: '/brand/onemorefit-logo-branco.png' }
const ICONE = { colorida: '/brand/onemorefit-icone.png', branca: '/brand/onemorefit-icone-branco.png' }

/** Logo completa (símbolo + nome). Proporção original: 1200 x 233. */
export function Logo({
  variante = 'colorida', largura = 180, className, prioridade = false,
}: { variante?: Variante; largura?: number; className?: string; prioridade?: boolean }) {
  return (
    <Image
      src={LOGO[variante]}
      alt="OneMoreFit"
      width={largura}
      height={Math.round((largura * 233) / 1200)}
      className={className}
      priority={prioridade}
    />
  )
}

/** Somente o símbolo, para espaços pequenos (menu recolhido, avatares). */
export function LogoIcone({
  variante = 'colorida', tamanho = 32, className,
}: { variante?: Variante; tamanho?: number; className?: string }) {
  return (
    <Image src={ICONE[variante]} alt="OneMoreFit" width={tamanho} height={tamanho} className={className} />
  )
}
