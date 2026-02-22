import { ReactNode } from 'react';
import { Container } from './Container';

export function PageHero({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <section className="bg-gradient-to-r from-brand-primaryLight to-white py-14">
      <Container>
        <h1 className="text-3xl font-bold tracking-tight text-brand-text md:text-4xl">{title}</h1>
        {subtitle ? <p className="mt-3 max-w-2xl text-base leading-relaxed text-brand-muted">{subtitle}</p> : null}
        {children}
      </Container>
    </section>
  );
}
