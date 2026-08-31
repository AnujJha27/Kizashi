"use client";

import { ExternalSourceViewer } from "@/components/learning/external-source-viewer";
import { ExternalSourceLauncher, externalResourceToSourceLink } from "@/components/learning/external-source-launcher";
import { getExternalResourceById } from "@/lib/external-resources";

const resource = getExternalResourceById("irodori-ordering-food");

export function IrodoriPracticeCard() {
  if (!resource) return null;
  const source = externalResourceToSourceLink(resource);
  const canDo = resource.metadata?.canDo;
  return <section className="mt-6 rounded-xl border border-[#3f3427] bg-[#211d18]/65 p-5"><p className="eyebrow">Real-world practice · 実際に使う</p><h2 className="mt-2 text-lg font-medium text-[#f5f5f2]">Irodori · {resource.metadata?.course}</h2><p className="mt-1 text-sm text-[#e5b85c]">{canDo}</p><p className="mt-2 text-sm leading-6 text-[#9297a1]">Practice ordering food with the Japan Foundation's practical lesson after the Kizashi foundations.</p><div className="mt-4 flex flex-wrap gap-2"><ExternalSourceViewer source={source} /><ExternalSourceLauncher source={source}>Practice with Irodori ↗</ExternalSourceLauncher></div></section>;
}

