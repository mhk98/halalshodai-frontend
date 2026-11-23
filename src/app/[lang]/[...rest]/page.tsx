import { notFound } from 'next/navigation';

/** Any unknown multi-segment path renders the localized 404 page. */
export default function CatchAll() {
  notFound();
}
