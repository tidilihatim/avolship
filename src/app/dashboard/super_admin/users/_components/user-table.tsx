'use client';

import React, { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { PlusCircle, Search, FilterX, Filter, MoreHorizontal, Edit, Trash2, Eye, FileText } from 'lucide-react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from "sonner";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger, 
  SheetClose
} from '@/components/ui/sheet';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

import { UserRole, UserStatus } from '@/app/dashboard/_constant/user';
import { UserTableData, UserFilters, PaginationData } from '@/types/user';
import { deleteUser, updateUserStatus } from '@/app/actions/user';
import SellerAgentAssignment from './seller-agent-assignment';

// Constants for filter values
const ALL_ROLES = "all_roles";
const ALL_STATUSES = "all_statuses";
const ALL_COUNTRIES = "all_countries";

interface UserTableProps {
  users: UserTableData[];
  allCountries?: string[];
  callCenterAgents?: Array<{
    _id: string;
    name: string;
    email: string;
  }>;
  pagination?: PaginationData;
  error?: string;
  filters: UserFilters;
}

/**
 * UserTable Component
 * Displays a list of users with filtering, search, pagination and action capabilities
 */
export default function UserTable({ users, allCountries = [], callCenterAgents = [], pagination, error, filters }: UserTableProps) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  
  // State for search and filters
  const [search, setSearch] = useState(filters.search || '');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [roleFilter, setRoleFilter] = useState(filters.role || ALL_ROLES);
  const [statusFilter, setStatusFilter] = useState(filters.status || ALL_STATUSES);
  const [countryFilter, setCountryFilter] = useState(filters.country || ALL_COUNTRIES);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  
  // Use the passed call center agents (available on all pages)
  // This ensures assignment dropdown works correctly on all pages
  
  // Use countries provided from the database, or fallback to extracting from current users
  const countries = allCountries.length > 0 
    ? allCountries 
    : Array.from(new Set(users.map(user => user.country).filter(Boolean))).sort();
  
  // Handle search submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigateWithFilters({
      search: search || undefined,
      role: roleFilter !== ALL_ROLES ? (roleFilter as UserRole) : undefined,
      status: statusFilter !== ALL_STATUSES ? (statusFilter as UserStatus) : undefined,
      country: countryFilter !== ALL_COUNTRIES ? countryFilter : undefined,
      page: 1, // Reset to first page on new search
      limit: itemsPerPage
    });
  };
  
  // Apply filters
  const applyFilters = () => {
    navigateWithFilters({
      search: search || undefined,
      role: roleFilter !== ALL_ROLES ? (roleFilter as UserRole) : undefined,
      status: statusFilter !== ALL_STATUSES ? (statusFilter as UserStatus) : undefined,
      country: countryFilter !== ALL_COUNTRIES ? countryFilter : undefined,
      page: 1, // Reset to first page on filter change
      limit: itemsPerPage
    });
    setIsFiltersOpen(false);
  };
  
  // Clear all filters
  const clearFilters = () => {
    setSearch('');
    setRoleFilter(ALL_ROLES);
    setStatusFilter(ALL_STATUSES);
    setCountryFilter(ALL_COUNTRIES);
    navigateWithFilters({
      page: 1,
      limit: itemsPerPage
    });
    setIsFiltersOpen(false);
  };
  
  // Change page
  const handlePageChange = (page: number) => {
    navigateWithFilters({
      ...filters,
      page
    });
  };
  
  // Change items per page
  const handleItemsPerPageChange = (value: string) => {
    const limit = parseInt(value);
    setItemsPerPage(limit);
    navigateWithFilters({
      ...filters,
      page: 1, // Reset to first page when changing limit
      limit
    });
  };
  
  // Helper function to navigate with filters
  const navigateWithFilters = (newFilters: any) => {
    const params = new URLSearchParams();
    
    if (newFilters.search) params.append('search', newFilters.search);
    if (newFilters.role) params.append('role', newFilters.role);
    if (newFilters.status) params.append('status', newFilters.status);
    if (newFilters.country) params.append('country', newFilters.country);
    if (newFilters.page) params.append('page', newFilters.page.toString());
    if (newFilters.limit) params.append('limit', newFilters.limit.toString());
    
    router.push(`${pathname}?${params.toString()}`);
  };
  
  // Handle user deletion
  const handleDelete = async (id: string) => {
    startTransition(async () => {
      const result = await deleteUser(id);
      
      if (result.success) {
        toast(t('users.userDeleted'));
        
        // If we're on the last page and delete the last item, go to previous page
        if (pagination && 
            pagination.page > 1 && 
            users.length === 1 && 
            pagination.page === pagination.totalPages) {
          handlePageChange(pagination.page - 1);
        } else {
          // Otherwise just refresh the current page
          router.refresh();
        }
      } else {
        toast.error(result.message || 'Failed to delete user');
      }
    });
  };
  
  // Handle status toggle
  const handleStatusUpdate = async (id: string, status: UserStatus) => {
    startTransition(async () => {
      const result = await updateUserStatus(id, status);
      
      if (result.success) {
        toast(t('users.userUpdated'));
        router.refresh();
      } else {
        toast.error(result.message || 'Failed to update status');
      }
    });
  };
  
  // Generate pagination items
  const renderPaginationItems = () => {
    if (!pagination) return null;
    
    const { page, totalPages } = pagination;
    const items = [];
    
    // Previous button
    items.push(
      <PaginationItem key="prev">
        <PaginationPrevious 
          href="#" 
          onClick={(e) => {
            e.preventDefault();
            if (page > 1) handlePageChange(page - 1);
          }}
          className={page <= 1 ? "pointer-events-none opacity-50" : ""}
        />
      </PaginationItem>
    );
    
    // First page
    items.push(
      <PaginationItem key="page-1">
        <PaginationLink 
          href="#" 
          onClick={(e) => {
            e.preventDefault();
            handlePageChange(1);
          }}
          isActive={page === 1}
        >
          1
        </PaginationLink>
      </PaginationItem>
    );
    
    // Ellipsis if needed
    if (page > 3) {
      items.push(
        <PaginationItem key="ellipsis-1">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }
    
    // Pages around current page
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      if (i <= 1 || i >= totalPages) continue; // Skip first and last page as they're handled separately
      
      items.push(
        <PaginationItem key={`page-${i}`}>
          <PaginationLink 
            href="#" 
            onClick={(e) => {
              e.preventDefault();
              handlePageChange(i);
            }}
            isActive={page === i}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    // Ellipsis if needed
    if (page < totalPages - 2) {
      items.push(
        <PaginationItem key="ellipsis-2">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }
    
    // Last page (if more than one page)
    if (totalPages > 1) {
      items.push(
        <PaginationItem key={`page-${totalPages}`}>
          <PaginationLink 
            href="#" 
            onClick={(e) => {
              e.preventDefault();
              handlePageChange(totalPages);
            }}
            isActive={page === totalPages}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    // Next button
    items.push(
      <PaginationItem key="next">
        <PaginationNext 
          href="#" 
          onClick={(e) => {
            e.preventDefault();
            if (page < totalPages) handlePageChange(page + 1);
          }}
          className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
        />
      </PaginationItem>
    );
    
    return items;
  };

  // Get role badge styling
  const getRoleBadge = (role: UserRole) => {
    const roleConfig = {
      [UserRole.ADMIN]: { label: t('users.roles.admin'), className: 'bg-purple-50 text-purple-700 hover:bg-purple-50 border-purple-200' },
      [UserRole.MODERATOR]: { label: t('users.roles.moderator'), className: 'bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-200' },
      [UserRole.SELLER]: { label: t('users.roles.seller'), className: 'bg-green-50 text-green-700 hover:bg-green-50 border-green-200' },
      [UserRole.PROVIDER]: { label: t('users.roles.provider'), className: 'bg-orange-50 text-orange-700 hover:bg-orange-50 border-orange-200' },
      [UserRole.DELIVERY]: { label: t('users.roles.delivery'), className: 'bg-cyan-50 text-cyan-700 hover:bg-cyan-50 border-cyan-200' },
      [UserRole.SUPPORT]: { label: t('users.roles.support'), className: 'bg-pink-50 text-pink-700 hover:bg-pink-50 border-pink-200' },
      [UserRole.CALL_CENTER]: { label: t('users.roles.call_center'), className: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-50 border-indigo-200' },
      [UserRole.SUPPER_ADMIN]: { label:"super_admin", className: 'bg-purple-50 text-purple-700 hover:bg-purple-50 border-purple-200' },

    };
    
    return roleConfig[role] || { label: 'Unknown', className: 'bg-gray-50 text-gray-700 hover:bg-gray-50 border-gray-200' };
  };

  // Get status badge styling
  const getStatusBadge = (status: UserStatus) => {
    const statusConfig = {
      [UserStatus.APPROVED]: { label: t('users.statuses.approved'), className: 'bg-green-50 text-green-700 hover:bg-green-50 border-green-200' },
      [UserStatus.PENDING]: { label: t('users.statuses.pending'), className: 'bg-yellow-50 text-yellow-700 hover:bg-yellow-50 border-yellow-200' },
      [UserStatus.REJECTED]: { label: t('users.statuses.rejected'), className: 'bg-red-50 text-red-700 hover:bg-red-50 border-red-200' }
    };
    
    return statusConfig[status] || { label: 'Unknown', className: 'bg-gray-50 text-gray-700 hover:bg-gray-50 border-gray-200' };
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(date));
  };
  
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('users.title')}</CardTitle>
          <CardDescription className="text-red-500">{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <form onSubmit={handleSearch} className="flex w-full sm:w-auto gap-2">
          <div className="relative flex-1 sm:min-w-[300px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder={t('users.searchUsers')}
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button type="submit" variant="default">
            {t('users.applyFilters')}
          </Button>
        </form>

        <div className="flex gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="flex gap-2">
                <Filter className="h-4 w-4" />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="p-4">
              <SheetHeader className="px-1">
                <SheetTitle className="text-xl">Filters</SheetTitle>
                <SheetDescription className="text-sm">
                  {t('users.applyFilters')}
                </SheetDescription>
              </SheetHeader>
              
              <div className="py-8 space-y-8">
                {/* Role Filter */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium leading-tight">
                    {t('users.filterByRole')}
                  </h3>
                  <Select
                    value={roleFilter}
                    onValueChange={setRoleFilter}
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder="All Roles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_ROLES}>All Roles</SelectItem>
                      {Object.values(UserRole).map((role) => (
                        <SelectItem key={role} value={role}>
                          {getRoleBadge(role).label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Status Filter */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium leading-tight">
                    {t('users.filterByStatus')}
                  </h3>
                  <Select
                    value={statusFilter}
                    onValueChange={setStatusFilter}
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_STATUSES}>All Statuses</SelectItem>
                      {Object.values(UserStatus).map((status) => (
                        <SelectItem key={status} value={status}>
                          {getStatusBadge(status).label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Country Filter */}
                {countries.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium leading-tight">
                      {t('users.filterByCountry')}
                    </h3>
                    <Select
                      value={countryFilter}
                      onValueChange={setCountryFilter}
                    >
                      <SelectTrigger className='w-full'>
                        <SelectValue placeholder="All Countries" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL_COUNTRIES}>All Countries</SelectItem>
                        {countries.map((country) => (
                          <SelectItem key={country} value={country as string}>
                            {country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              
              {/* Actions */}
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-background border-t">
                <div className="flex flex-col gap-3">
                  <SheetClose asChild>
                    <Button onClick={applyFilters}>
                      {t('users.applyFilters')}
                    </Button>
                  </SheetClose>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={clearFilters}
                    className="flex items-center gap-2"
                  >
                    <FilterX className="h-4 w-4" />
                    {t('users.clearFilters')}
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Link href="/dashboard/super_admin/users/create" passHref>
            <Button className="flex gap-2">
              <PlusCircle className="h-4 w-4" />
              {t('users.createUser')}
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('users.title')}</CardTitle>
          <CardDescription>
            {pagination?.total 
              ? `${pagination.total} ${pagination.total === 1 ? 'user' : 'users'} found`
              : t('users.noUsersFound')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('common.name')}</TableHead>
                    <TableHead>{t('common.email')}</TableHead>
                    <TableHead className="hidden md:table-cell">{t('common.role')}</TableHead>
                    <TableHead className="hidden md:table-cell">{t('common.status')}</TableHead>
                    <TableHead className="hidden lg:table-cell">{t('common.country')}</TableHead>
                    <TableHead className="hidden lg:table-cell">2FA</TableHead>
                    <TableHead className="hidden xl:table-cell">{t('users.assignment.title')}</TableHead>
                    <TableHead className="hidden xl:table-cell">{t('common.createdAt')}</TableHead>
                    <TableHead className="text-right">{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell className="font-medium">
                        {user.name}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline" className={getRoleBadge(user.role).className}>
                          {getRoleBadge(user.role).label}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline" className={getStatusBadge(user.status).className}>
                          {getStatusBadge(user.status).label}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {user.country || '-'}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {user.twoFactorEnabled ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50 border-green-200">
                            Enabled
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-50 text-gray-600 hover:bg-gray-50 border-gray-200">
                            Disabled
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        {user.role === UserRole.SELLER ? (
                          <SellerAgentAssignment
                            sellerId={user._id}
                            currentAgent={user.assignedCallCenterAgent}
                            currentAgents={user.assignedCallCenterAgents}
                            agents={callCenterAgents}
                          />
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        {formatDate(user.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent  align="end">
                            <DropdownMenuLabel>{t('common.actions')}</DropdownMenuLabel>
                            <DropdownMenuItem className='cursor-pointer' asChild>
                              <Link href={`/dashboard/super_admin/users/${user._id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                {t('common.view')}
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/super_admin/users/${user._id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                {t('common.edit')}
                              </Link>
                            </DropdownMenuItem>
                            
                            {/* Generate Invoice for Sellers */}
                            {user.role === UserRole.SELLER && user.status === UserStatus.APPROVED && (
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/super_admin/users/${user._id}/invoice/generate`}>
                                  <FileText className="mr-2 h-4 w-4" />
                                  Generate Invoice
                                </Link>
                              </DropdownMenuItem>
                            )}
                            
                            <DropdownMenuSeparator />
                            
                            {/* Status Actions */}
                            {user.status !== UserStatus.APPROVED && (
                              <DropdownMenuItem
                                onClick={() => handleStatusUpdate(user._id, UserStatus.APPROVED)}
                              >
                                Approve
                              </DropdownMenuItem>
                            )}
                            {user.status !== UserStatus.REJECTED && (
                              <DropdownMenuItem
                                onClick={() => handleStatusUpdate(user._id, UserStatus.REJECTED)}
                              >
                                Reject
                              </DropdownMenuItem>
                            )}
                            {user.status !== UserStatus.PENDING && (
                              <DropdownMenuItem
                                onClick={() => handleStatusUpdate(user._id, UserStatus.PENDING)}
                              >
                                Set Pending
                              </DropdownMenuItem>
                            )}
                            
                            <DropdownMenuSeparator />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem 
                                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                  onSelect={(e) => e.preventDefault()}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  {t('common.delete')}
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete User</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {t('common.deleteUserSure')}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(user._id)}
                                    disabled={isPending}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
              <p className="text-muted-foreground text-center">
                {t('users.noUsersFound')}
              </p>
              <Link href="/dashboard/super_admin/users/create" passHref>
                <Button variant="outline">{t('users.createUser')}</Button>
              </Link>
            </div>
          )}
        </CardContent>
        {pagination && pagination.totalPages > 0 && (
          <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Items per page:
              </span>
              <Select
                value={String(itemsPerPage)}
                onValueChange={handleItemsPerPageChange}
              >
                <SelectTrigger className="w-[80px]">
                  <SelectValue placeholder="10" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Pagination>
              <PaginationContent>
                {renderPaginationItems()}
              </PaginationContent>
            </Pagination>
            
            <div className="text-sm text-muted-foreground">
              Showing {(pagination.page - 1) * pagination.limit + 1}-
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}