import Link from "next/link";
import { Icon } from "@/components/Icon";

export function AuthBrandPanel() {
  return (
    <aside className="hidden lg:flex relative w-[46%] cultural-pattern panel-curve flex-col justify-between px-14 py-12 text-primary-fixed overflow-hidden">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-primary-fixed/70 hover:text-primary-fixed font-label-md text-[12px] tracking-wide transition-colors w-fit z-10"
      >
        <Icon name="arrow_back" className="text-[18px]" />
        Beranda
      </Link>

      <div className="absolute top-[-10%] right-[-10%] w-72 h-72 bg-primary-fixed/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[10%] left-[-15%] w-80 h-80 bg-secondary-container/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative flex items-center justify-center flex-1">
        <svg
          className="w-full max-w-[340px]"
          viewBox="0 0 340 340"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <g className="weave-float" opacity="0.9">
            <path
              d="M170 20 L260 110 L170 200 L80 110 Z"
              stroke="#b0f0d6"
              strokeWidth="1.5"
              opacity="0.55"
            />
            <path
              d="M170 60 L230 120 L170 180 L110 120 Z"
              stroke="#fd925b"
              strokeWidth="1.5"
              opacity="0.7"
            />
            <path
              d="M170 90 L205 125 L170 160 L135 125 Z"
              fill="#f9bd22"
              opacity="0.85"
            />
          </g>
          <g className="weave-float-delay" opacity="0.85">
            <path
              d="M170 150 L260 240 L170 330 L80 240 Z"
              stroke="#b0f0d6"
              strokeWidth="1.5"
              opacity="0.5"
            />
            <path
              d="M170 190 L230 250 L170 310 L110 250 Z"
              stroke="#fd925b"
              strokeWidth="1.5"
              opacity="0.65"
            />
            <path
              d="M170 220 L205 255 L170 290 L135 255 Z"
              fill="#b0f0d6"
              opacity="0.9"
            />
          </g>
          <line
            x1="30"
            y1="170"
            x2="310"
            y2="170"
            stroke="#b0f0d6"
            strokeWidth="1"
            strokeDasharray="2 6"
            opacity="0.35"
          />
          <line
            x1="170"
            y1="10"
            x2="170"
            y2="330"
            stroke="#b0f0d6"
            strokeWidth="1"
            strokeDasharray="2 6"
            opacity="0.35"
          />
        </svg>
      </div>

      <div className="relative z-10">
        <div className="inline-flex items-center justify-center w-10 h-10 bg-primary-fixed/15 border border-primary-fixed/25 rounded-xl mb-4">
          <Icon name="architecture" className="text-primary-fixed text-[22px]" filled />
        </div>
        <h1 className="font-display text-[26px] font-extrabold text-primary-fixed leading-tight tracking-tight">
          KANUM
        </h1>
        <p className="text-primary-fixed/70 text-[13px] mt-1.5 max-w-[300px] leading-relaxed">
          Matematika dalam akar budaya — belajar pola, simetri, dan hitungan dari kearifan tenun Nusantara.
        </p>
      </div>
    </aside>
  );
}
