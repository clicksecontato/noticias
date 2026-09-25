"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarRange } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { VideosPeriodPreset } from "@/src/videos-list-query";
import { buildVideosQueryPath } from "@/src/videos-list-query";

const PRESETS: { value: VideosPeriodPreset; label: string }[] = [
  { value: "today", label: "Hoje" },
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
  { value: "90d", label: "90 dias" },
  { value: "", label: "Todo o período" },
];

interface VideosPeriodFilterProps {
  sourceIds: string[];
  period: VideosPeriodPreset;
  dateFrom: string;
  dateTo: string;
  className?: string;
}

export function VideosPeriodFilter({
  sourceIds,
  period,
  dateFrom,
  dateTo,
  className,
}: VideosPeriodFilterProps) {
  const [open, setOpen] = useState(false);
  const base = { sourceIds, basePath: "/videos" as const };
  const customActive = !period && Boolean(dateFrom || dateTo);

  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-sm font-medium text-muted-foreground">Período</p>
      <div className="flex flex-wrap items-center gap-2">
        {PRESETS.map(({ value, label }) => {
          const active =
            value === ""
              ? !period && !dateFrom && !dateTo
              : period === value;
          const href = buildVideosQueryPath({
            ...base,
            page: 1,
            period: value,
            dateFrom: "",
            dateTo: "",
          });
          return (
            <Link key={label} href={href} className="no-underline">
              <Badge
                variant={active ? "default" : "outline"}
                className="h-8 min-h-8 rounded-full px-3 text-xs font-medium leading-none"
              >
                {label}
              </Badge>
            </Link>
          );
        })}

        <Button
          type="button"
          variant={customActive ? "default" : "outline"}
          size="sm"
          className="h-8 rounded-full px-3 text-xs font-medium"
          onClick={() => setOpen(true)}
        >
          <CalendarRange className="mr-1.5 size-3.5" aria-hidden />
          Personalizar
          {customActive ? (
            <span className="ml-1.5 opacity-80">
              ({[dateFrom, dateTo].filter(Boolean).join(" → ")})
            </span>
          ) : null}
        </Button>
      </div>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Período personalizado</AlertDialogTitle>
            <AlertDialogDescription>
              Escolha a data inicial e final da publicação dos vídeos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <form
            action="/videos"
            method="get"
            className="space-y-4"
            onSubmit={() => setOpen(false)}
          >
            {sourceIds.length > 0 ? (
              <input type="hidden" name="source" value={sourceIds.join(",")} />
            ) : null}
            <input type="hidden" name="page" value="1" />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="videos-from">De</Label>
                <Input
                  id="videos-from"
                  type="date"
                  name="from"
                  defaultValue={period ? "" : dateFrom}
                  className="bg-background"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="videos-to">Até</Label>
                <Input
                  id="videos-to"
                  type="date"
                  name="to"
                  defaultValue={period ? "" : dateTo}
                  className="bg-background"
                  required
                />
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel type="button">Cancelar</AlertDialogCancel>
              <Button type="submit">Aplicar período</Button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
