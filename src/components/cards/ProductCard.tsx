import React from 'react';
import { Product } from '../../types/product';
import {
  BrainCircuit,
  Scan,
  Sparkles,
  Stars,
  Brain,
  Droplet,
  Heart,
  ArrowRight
} from 'lucide-react';

const ICON_MAP = {
  BrainCircuit,
  Scan,
  Sparkles,
  Stars,
  Brain,
  Droplet,
  Heart,
};

interface ProductCardProps {
  product: Product;
  onClick: () => void;
}

export function ProductCard({ product, onClick }: ProductCardProps) {
  const IconComponent = ICON_MAP[product.icon as keyof typeof ICON_MAP];

  return (
    <button
      onClick={onClick}
      className="group relative glass-panel p-6 rounded-2xl hover:scale-[1.02] transition-all duration-300 text-left overflow-hidden"
      style={{
        boxShadow: `0 0 30px ${product.color.from}20`,
      }}
    >
      {/* Gradient Background */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300"
        style={{
          background: `linear-gradient(135deg, ${product.color.from}, ${product.color.to})`,
        }}
      />

      {/* Badge */}
      {product.badge && (
        <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold nebula-gradient text-white">
          {product.badge}
        </div>
      )}

      {/* Icon */}
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
        style={{
          background: `linear-gradient(135deg, ${product.color.from}20, ${product.color.to}20)`,
          border: `1px solid ${product.color.from}40`,
        }}
      >
        {IconComponent && (
          <IconComponent
            className="w-8 h-8"
            style={{ color: product.color.from }}
          />
        )}
      </div>

      {/* Content */}
      <div className="relative z-10">
        <h3 className="text-2xl font-bold mb-1 text-starlight-200 font-serif">
          {product.title}
        </h3>
        <p
          className="text-sm font-medium mb-3"
          style={{ color: product.color.from }}
        >
          {product.subtitle}
        </p>
        <p className="text-sm text-starlight-300/70 leading-relaxed mb-4">
          {product.description}
        </p>
      </div>

      {/* CTA Arrow */}
      <div className="flex items-center gap-2 text-sm font-medium transition-all duration-300 group-hover:gap-3">
        <span style={{ color: product.color.from }}>시작하기</span>
        <ArrowRight
          className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
          style={{ color: product.color.from }}
        />
      </div>

      {/* Glow Effect on Hover */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          boxShadow: `0 0 40px ${product.color.from}30, inset 0 0 20px ${product.color.from}10`,
        }}
      />
    </button>
  );
}
