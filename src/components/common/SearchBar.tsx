import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  onClear?: () => void;
  placeholder?: string;
  showClearButton?: boolean;
}

/**
 * 统一的搜索栏组件
 * 提供一致的搜索框样式和交互
 */
export function SearchBar({
  value,
  onChange,
  onSearch,
  onClear,
  placeholder = '搜索...',
  showClearButton = true,
}: SearchBarProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
        <Search className="h-4 w-4 text-gray-400" />
        <Input
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-7 w-64 border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>
      <Button onClick={onSearch} size="sm" className="h-9 px-4">
        搜索
      </Button>
      {showClearButton && value && onClear && (
        <Button onClick={onClear} variant="outline" size="sm" className="h-9 px-3">
          <X className="h-4 w-4 mr-1" />
          清空
        </Button>
      )}
    </div>
  );
}
