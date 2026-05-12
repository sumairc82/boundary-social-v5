'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const MoveableComponent = dynamic(() => import('react-moveable'), { ssr: false });

interface StudioProps {
  active: boolean;
  posterRef: React.RefObject<HTMLDivElement | null>;
}

export default function DesignStudio({ active, posterRef }: StudioProps) {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [frame, setFrame] = useState({ translate: [0, 0], rotate: 0 });

  useEffect(() => {
    if (!active || !posterRef.current) {
      setTarget(null);
      return;
    }

    const poster = posterRef.current;

    const handleClick = (e: MouseEvent) => {
      e.stopPropagation();
      const el = e.target as HTMLElement;
      if (el === poster || el.classList.contains('poster') || el.classList.contains('poster-inner') || el.classList.contains('poster-bg-image')) return;

      let selected: HTMLElement | null = el;
      const excluded = ['poster', 'poster-inner', 'poster-bg-image'];
      while (selected && excluded.some(c => selected!.classList.contains(c))) {
        selected = selected.parentElement;
      }

      if (selected && selected !== poster) {
        const computed = window.getComputedStyle(selected);
        if (computed.position === 'static' || computed.position === 'relative') {
          const rect = selected.getBoundingClientRect();
          const posterRect = poster.getBoundingClientRect();
          selected.style.position = 'absolute';
          selected.style.left = (rect.left - posterRect.left) + 'px';
          selected.style.top = (rect.top - posterRect.top) + 'px';
          selected.style.width = rect.width + 'px';
          selected.style.zIndex = '10';
        }
        setTarget(selected);
        setFrame({ translate: [0, 0], rotate: 0 });
      }
    };

    const handlePosterClick = (e: MouseEvent) => {
      if (e.target === poster) setTarget(null);
    };

    poster.addEventListener('click', handleClick, true);
    poster.addEventListener('click', handlePosterClick);

    return () => {
      poster.removeEventListener('click', handleClick, true);
      poster.removeEventListener('click', handlePosterClick);
    };
  }, [active, posterRef]);

  if (!active || !target) return null;

  return (
    <MoveableComponent
      target={target}
      draggable={true}
      resizable={true}
      rotatable={true}
      snappable={true}
      throttleDrag={0}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onDrag={(e: any) => {
        const { target: t, beforeTranslate } = e;
        t.style.transform = `translate(${beforeTranslate[0]}px, ${beforeTranslate[1]}px) rotate(${frame.rotate}deg)`;
        setFrame(f => ({ ...f, translate: beforeTranslate }));
      }}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onResize={(e: any) => {
        const { target: t, width, height, drag } = e;
        t.style.width = `${width}px`;
        t.style.height = `${height}px`;
        t.style.transform = `translate(${drag.beforeTranslate[0]}px, ${drag.beforeTranslate[1]}px)`;
      }}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onRotate={(e: any) => {
        const { target: t, beforeRotate } = e;
        t.style.transform = `translate(${frame.translate[0]}px, ${frame.translate[1]}px) rotate(${beforeRotate}deg)`;
        setFrame(f => ({ ...f, rotate: beforeRotate }));
      }}
    />
  );
}
