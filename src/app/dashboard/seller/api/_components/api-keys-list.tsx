'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslations } from 'next-intl';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { MoreHorizontal, Edit, Trash, Eye, EyeOff } from 'lucide-react';
import { format } from 'date-fns';
import { updateApiKey, revokeApiKey } from '../_actions/api-keys';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { EditApiKeyDialog } from './edit-api-key-dialog';

interface ApiKey {
  _id: string;
  keyId: string;
  name: string;
  status: 'active' | 'inactive' | 'revoked';
  lastUsed?: string;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

interface ApiKeysListProps {
  apiKeys: ApiKey[];
}

export function ApiKeysList({ apiKeys }: ApiKeysListProps) {
  const router = useRouter();
  const t = useTranslations('apiManagement');
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [keyToRevoke, setKeyToRevoke] = useState<string>('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [keyToEdit, setKeyToEdit] = useState<ApiKey | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<string>('');

  const handleRevoke = async () => {
    if (!keyToRevoke) return;

    setLoading('revoke');
    try {
      const result = await revokeApiKey(keyToRevoke);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(t('success.revoked'));
        router.refresh();
      }
    } catch (error) {
      toast.error(t('errors.failedToRevoke'));
    } finally {
      setLoading('');
      setRevokeDialogOpen(false);
      setKeyToRevoke('');
    }
  };

  const handleStatusToggle = async (keyId: string, currentStatus: string) => {
    setLoading(keyId);
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      const result = await updateApiKey({ keyId, status: newStatus as any });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.message);
        router.refresh();
      }
    } catch (error) {
      toast.error(t('errors.failedToRevoke'));
    } finally {
      setLoading('');
    }
  };

  const toggleKeyVisibility = (keyId: string) => {
    const newVisible = new Set(visibleKeys);
    if (newVisible.has(keyId)) {
      newVisible.delete(keyId);
    } else {
      newVisible.add(keyId);
    }
    setVisibleKeys(newVisible);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'default',
      inactive: 'secondary',
      revoked: 'destructive',
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {t(`apiKeys.${status}`)}
      </Badge>
    );
  };

  const maskKey = (keyId: string) => {
    if (visibleKeys.has(keyId)) {
      return keyId;
    }
    return keyId.substring(0, 8) + '••••••••••••••••••••••••';
  };

  if (apiKeys.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
          <Eye className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">No API keys yet</h3>
        <p className="text-muted-foreground mb-4">
          Create your first API key to start integrating with our platform
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('apiKeys.name')}</TableHead>
              <TableHead>Key ID</TableHead>
              <TableHead>{t('apiKeys.status')}</TableHead>
              <TableHead>Usage</TableHead>
              <TableHead>{t('apiKeys.lastUsed')}</TableHead>
              <TableHead>{t('apiKeys.createdAt')}</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {apiKeys.map((apiKey) => (
              <TableRow key={apiKey._id}>
                <TableCell className="font-medium">{apiKey.name}</TableCell>
                <TableCell className="font-mono text-sm">
                  <div className="flex items-center gap-2">
                    {maskKey(apiKey.keyId)}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleKeyVisibility(apiKey.keyId)}
                    >
                      {visibleKeys.has(apiKey.keyId) ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(apiKey.status)}</TableCell>
                <TableCell>{apiKey.usageCount.toLocaleString()}</TableCell>
                <TableCell>
                  {apiKey.lastUsed
                    ? format(new Date(apiKey.lastUsed), 'MMM dd, yyyy')
                    : t('apiKeys.never')}
                </TableCell>
                <TableCell>
                  {format(new Date(apiKey.createdAt), 'MMM dd, yyyy')}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        disabled={loading === apiKey.keyId}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>{t('apiKeys.actions')}</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => {
                          setKeyToEdit(apiKey);
                          setEditDialogOpen(true);
                        }}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      {apiKey.status !== 'revoked' && (
                        <DropdownMenuItem
                          onClick={() => handleStatusToggle(apiKey.keyId, apiKey.status)}
                          disabled={loading === apiKey.keyId}
                        >
                          {apiKey.status === 'active' ? 'Deactivate' : 'Activate'}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => {
                          setKeyToRevoke(apiKey.keyId);
                          setRevokeDialogOpen(true);
                        }}
                        disabled={apiKey.status === 'revoked'}
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        {t('apiKeys.revoke')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Revoke Confirmation Dialog */}
      <AlertDialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke API Key</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke this API key? This action cannot be undone.
              Any applications using this key will immediately lose access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevoke}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={loading === 'revoke'}
            >
              {loading === 'revoke' ? 'Revoking...' : 'Revoke'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <EditApiKeyDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        apiKey={keyToEdit}
        onSuccess={() => {
          setEditDialogOpen(false);
          setKeyToEdit(null);
          router.refresh();
        }}
      />
    </>
  );
}