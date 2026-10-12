import { getInitials, cn } from '@/lib/utils';

interface AvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  ring?: boolean;
}

const sizeMap = {
  xs: { box: 'h-6 w-6', text: 'text-[9px]' },
  sm: { box: 'h-7 w-7', text: 'text-[10px]' },
  md: { box: 'h-9 w-9', text: 'text-xs' },
  lg: { box: 'h-11 w-11', text: 'text-sm' },
  xl: { box: 'h-24 w-24', text: 'text-2xl' },
};

export function Avatar({
  name,
  avatarUrl,
  size = 'md',
  className,
  ring = false,
}: AvatarProps) {
  const { box, text } = sizeMap[size];

  return (
    <div
      className={cn(
        'shrink-0 overflow-hidden rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 font-bold text-white',
        box,
        ring && 'ring-2 ring-slate-200',
        className
      )}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className={cn('flex h-full w-full items-center justify-center', text)}>
          {getInitials(name)}
        </div>
      )}
    </div>
  );
}