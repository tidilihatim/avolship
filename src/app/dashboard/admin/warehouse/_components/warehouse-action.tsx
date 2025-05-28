'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Edit, Eye, Trash2, MoreHorizontal, Power } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { Warehouse } from '@/types/warehouse';

interface WarehouseActionsProps {
  warehouse: Warehouse;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
}

/**
 * WarehouseActions Component
 * Provides action buttons (view, edit, delete, toggle status) for a single warehouse
 */
export default function WarehouseActions({
  warehouse,
  onDelete,
  onToggleStatus,
}: WarehouseActionsProps) {
  const t = useTranslations('warehouse.actions');
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isStatusAlertOpen, setIsStatusAlertOpen] = useState(false);
  
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/admin/warehouse/${warehouse._id}`} className="cursor-pointer flex items-center">
              <Eye className="mr-2 h-4 w-4" />
              <span>{t('view')}</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/admin/warehouse/${warehouse._id}/edit`} className="cursor-pointer flex items-center">
              <Edit className="mr-2 h-4 w-4" />
              <span>{t('edit')}</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setIsStatusAlertOpen(true)}
            className="cursor-pointer flex items-center"
          >
            <Power className="mr-2 h-4 w-4" />
            <span>{warehouse.isActive ? t('deactivate') : t('activate')}</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setIsDeleteAlertOpen(true)}
            className="cursor-pointer text-destructive focus:text-destructive flex items-center"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            <span>{t('delete')}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={isDeleteAlertOpen}
        onOpenChange={setIsDeleteAlertOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('delete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('confirmDelete')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onDelete(warehouse._id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Status toggle confirmation dialog */}
      <AlertDialog
        open={isStatusAlertOpen}
        onOpenChange={setIsStatusAlertOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {warehouse.isActive ? t('deactivate') : t('activate')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('confirmToggleStatus')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => onToggleStatus(warehouse._id)}>
              {t('confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}