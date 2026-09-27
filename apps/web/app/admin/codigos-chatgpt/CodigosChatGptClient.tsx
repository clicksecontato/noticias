"use client";

import { PresentationStage, Slide } from "../../components/reports/PresentationStage";
import { CHATGPT_CODES } from "@/src/admin/chatgpt-codes";

export function CodigosChatGptClient() {
  return (
    <PresentationStage kicker="Códigos do ChatGPT">
      {CHATGPT_CODES.map((item) => (
        <Slide key={item.code} title={item.code}>
          <div className="grid h-full min-h-0 grid-cols-2 items-stretch gap-10">
            <div className="flex h-full min-h-0 flex-col justify-center gap-8">
              <p className="text-lg font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Código {item.n} de {CHATGPT_CODES.length}
              </p>
              <p className="max-w-5xl text-4xl font-medium leading-tight tracking-tight sm:text-5xl">
                {item.does}
              </p>
              <p className="max-w-4xl text-2xl leading-relaxed text-muted-foreground">{item.use}</p>
            </div>
            <aside className="flex h-full min-h-0 flex-col justify-center">
              <div className="theme-scrollbar flex max-h-full min-h-0 flex-col gap-4 overflow-y-auto rounded-3xl border border-border bg-card/50 p-6">
                <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Exemplo no chat
                </p>
                <div className="rounded-2xl bg-muted px-5 py-4">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Você</p>
                  <p className="mt-2 whitespace-pre-line text-lg leading-relaxed">{item.example.input}</p>
                </div>
                <div className="rounded-2xl border border-border bg-background px-5 py-4">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">ChatGPT</p>
                  <p className="mt-2 whitespace-pre-line text-lg leading-relaxed">{item.example.output}</p>
                </div>
              </div>
            </aside>
          </div>
        </Slide>
      ))}
    </PresentationStage>
  );
}
