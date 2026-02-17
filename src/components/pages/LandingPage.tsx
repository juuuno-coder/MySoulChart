import React from 'react';
import { PRODUCTS } from '../../types/product';
import { ProductCard } from '../cards/ProductCard';
import { Sparkles } from 'lucide-react';

interface LandingPageProps {
  onSelectProduct: (productId: string) => void;
}

export default function LandingPage({ onSelectProduct }: LandingPageProps) {
  return (
    <div className="min-h-screen px-4 py-12 md:py-16">
      {/* Hero Section */}
      <div className="max-w-4xl mx-auto text-center mb-16">
        <div className="flex items-center justify-center gap-4 mb-6">
          <Sparkles className="w-12 h-12 text-nebula-400 star-twinkle" />
          <h1 className="font-serif text-5xl md:text-7xl font-bold glow-nebula" style={{ color: '#a78bfa' }}>
            My Soul Chart
          </h1>
        </div>

        <p className="text-xl md:text-2xl text-starlight-200 mb-4 font-medium">
          나의 영혼을 탐험하는 여정
        </p>

        <p className="text-base text-starlight-300/80 max-w-2xl mx-auto leading-relaxed">
          AI가 관상, 사주, 점성학, MBTI, 혈액형을 통합 분석하여<br className="hidden md:block" />
          당신의 내면을 깊이 이해하고 삶의 방향성을 찾도록 돕습니다.
        </p>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PRODUCTS.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onClick={() => onSelectProduct(product.id)}
            />
          ))}
        </div>
      </div>

      {/* Footer Info */}
      <div className="max-w-4xl mx-auto mt-16 text-center">
        <p className="text-sm text-starlight-400/50">
          ✨ AI 영혼 안내자가 당신의 이야기에 귀 기울입니다
        </p>
      </div>
    </div>
  );
}
