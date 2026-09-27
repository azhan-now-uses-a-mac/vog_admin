import { Link } from 'react-router-dom'
import { PageShell } from '@/components/layout/PageShell'
import { buttonClassName } from '@/components/ui/Button'
import { SITE } from '@/config/site'

interface NotFoundPageProps {
  title?: string
  message?: string
}

export function NotFoundPage({
  title = 'Page not found',
  message = 'This donation link is not valid. Please use the event URL you were given.',
}: NotFoundPageProps) {
  return (
    <PageShell>
      <section className="rounded-3xl border border-vog-brown/10 bg-white p-6 text-center sm:p-10">
        <h1 className="text-3xl font-semibold text-vog-brown">{title}</h1>
        <p className="mt-4 text-vog-brown/75">{message}</p>
        <div className="mx-auto mt-8 max-w-xs">
          <Link to="/" className={buttonClassName()}>
            Back to donations home
          </Link>
        </div>
        <p className="mt-6 text-sm text-vog-brown/60">
          Visit{' '}
          <a className="underline" href={SITE.mainSiteUrl}>
            {SITE.name}
          </a>{' '}
          for more information.
        </p>
      </section>
    </PageShell>
  )
}
