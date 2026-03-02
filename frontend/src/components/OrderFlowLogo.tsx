import { ChefHat } from 'lucide-react';

export function OrderFlowLogo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: { container: 'w-10 h-10', text: 'text-xs' },
    md: { container: 'w-12 h-12', text: 'text-xl' },
    lg: { container: 'w-20 h-20', text: 'text-3xl' },
  };

  return (
    <div className="flex items-center space-x-3">
      <div className={`${sizes[size].container} bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg`}>
        <ChefHat className="w-3/5 h-3/5 text-white" />
      </div>
      <div className="flex flex-col">
        <span className={`font-bold text-gray-800 leading-tight ${sizes[size].text}`}>
          OrderFlow
        </span>
        <span className="text-xs text-orange-600 leading-none">POS System</span>
      </div>
    </div>
  );
}