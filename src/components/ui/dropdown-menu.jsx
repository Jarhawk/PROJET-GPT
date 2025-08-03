// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";

export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

export const DropdownMenuContent = React.forwardRef(({ className = "", ...props }, ref) => (
  <DropdownMenuPrimitive.Content
    ref={ref}
    className={`min-w-[8rem] rounded-md bg-white text-black shadow-md p-1 ${className}`}
    {...props}
  />
));
DropdownMenuContent.displayName = "DropdownMenuContent";

export const DropdownMenuItem = React.forwardRef(({ className = "", ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={`cursor-pointer select-none rounded-sm px-2 py-1 text-sm hover:bg-gray-100 ${className}`}
    {...props}
  />
));
DropdownMenuItem.displayName = "DropdownMenuItem";
