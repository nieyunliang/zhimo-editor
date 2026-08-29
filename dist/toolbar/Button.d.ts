import { LucideIcon } from 'lucide-react';
export interface ToolButtonProps {
    icon: LucideIcon;
    label: string;
    shortcut?: string;
    active?: boolean;
    disabled?: boolean;
    onClick: () => void;
}
/** 工具栏图标按钮（hover 显示中文 tooltip + 快捷键） */
export declare function ToolButton({ icon: Icon, label, shortcut, active, disabled, onClick, }: ToolButtonProps): import("react").JSX.Element;
