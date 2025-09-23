'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  MessageSquare,
  Phone,
  Mail,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Download
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getContactSubmissions, updateContactStatus, addContactNote } from '@/app/actions/contact';

interface Contact {
  _id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  countryCode: string;
  country: string;
  message: string;
  status: 'new' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: {
    _id: string;
    name: string;
    email: string;
  };
  adminNotes?: Array<{
    note: string;
    createdBy: {
      name: string;
      email: string;
    };
    createdAt: string;
  }>;
  deviceInfo?: {
    platform?: string;
    language?: string;
  };
  ipAddress?: string;
  location?: {
    country?: string;
    city?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface Filters {
  status: string;
  priority: string;
  country: string;
  search: string;
}

interface ContactManagementTableProps {
  userRole: 'admin' | 'moderator';
  currentUserId: string;
}

const ContactManagementTable: React.FC<ContactManagementTableProps> = ({
  userRole,
  currentUserId
}) => {
  const t = useTranslations('contactManagement');
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // State management
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [noteText, setNoteText] = useState('');
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  // Pagination and filters
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState<Filters>({
    status: 'all',
    priority: 'all',
    country: '',
    search: ''
  });

  const itemsPerPage = 20;

  // Load contacts
  const loadContacts = async (page = currentPage) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: itemsPerPage,
        ...(filters.status && filters.status !== 'all' && { status: filters.status }),
        ...(filters.priority && filters.priority !== 'all' && { priority: filters.priority }),
        ...(filters.country && { country: filters.country }),
        ...(filters.search && { search: filters.search }),
      };

      const result = await getContactSubmissions(params);

      if (result.contacts && result.pagination) {
        setContacts(result.contacts);
        setTotalPages(result.pagination.totalPages);
        setTotalCount(result.pagination.total);
      } else if (result.error) {
        toast.error(result.error);
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
      toast.error(t('errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  // Initial load and reload on filter changes
  useEffect(() => {
    loadContacts(1);
    setCurrentPage(1);
  }, [filters]);

  // Handle query parameter for opening specific contact
  useEffect(() => {
    const contactId = searchParams.get('contact_id');
    if (contactId && contacts.length > 0) {
      const contact = contacts.find(c => c._id === contactId);
      if (contact) {
        setSelectedContact(contact);
        setShowDetailsDialog(true);
      } else {
        // Contact not found in current page, try to fetch it specifically
        fetchSpecificContact(contactId);
      }
    }
  }, [searchParams, contacts]);

  // Function to fetch a specific contact by ID
  const fetchSpecificContact = async (contactId: string) => {
    try {
      setLoading(true);
      // Search for the contact across all pages
      const result = await getContactSubmissions({
        search: contactId,
        page: 1,
        limit: 1
      });

      if (result.contacts && result.contacts.length > 0) {
        const contact = result.contacts.find((c: Contact) => c._id === contactId);
        if (contact) {
          setSelectedContact(contact);
          setShowDetailsDialog(true);
        } else {
          toast.error(t('errors.contactNotFound'));
          clearQueryParams();
        }
      } else {
        toast.error(t('errors.contactNotFound'));
        clearQueryParams();
      }
    } catch (error) {
      console.error('Error fetching specific contact:', error);
      toast.error(t('errors.loadFailed'));
      clearQueryParams();
    } finally {
      setLoading(false);
    }
  };

  // Function to clear query parameters
  const clearQueryParams = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('contact_id');
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(newUrl);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadContacts(page);
  };

  // Handle status update
  const handleStatusUpdate = async (contactId: string, newStatus: string) => {
    setActionLoading(contactId);
    try {
      const result = await updateContactStatus(contactId, newStatus);

      if (result.contact) {
        setContacts(prev =>
          prev.map(contact =>
            contact._id === contactId
              ? { ...contact, status: newStatus as any }
              : contact
          )
        );
        toast.success(t('statusUpdated'));
      } else if (result.error) {
        toast.error(result.error);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(t('errors.updateFailed'));
    } finally {
      setActionLoading(null);
    }
  };

  // Handle add note
  const handleAddNote = async () => {
    if (!selectedContact || !noteText.trim()) return;

    setActionLoading('note');
    try {
      const result = await addContactNote(selectedContact._id, noteText.trim(), currentUserId);

      if (result.contact) {
        setContacts(prev =>
          prev.map(contact =>
            contact._id === selectedContact._id
              ? result.contact!
              : contact
          )
        );
        setSelectedContact(result.contact);
        setNoteText('');
        toast.success(t('noteAdded'));
      } else if (result.error) {
        toast.error(result.error);
      }
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error(t('errors.noteFailed'));
    } finally {
      setActionLoading(null);
    }
  };

  // Status badge component
  const StatusBadge: React.FC<{ status: Contact['status'] }> = ({ status }) => {
    const variants = {
      new: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      resolved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      closed: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    };

    const icons = {
      new: AlertCircle,
      in_progress: Clock,
      resolved: CheckCircle,
      closed: XCircle
    };

    const Icon = icons[status];

    return (
      <Badge variant="secondary" className={cn('gap-1', variants[status])}>
        <Icon className="h-3 w-3" />
        {t(`status.${status}`)}
      </Badge>
    );
  };

  // Priority badge component
  const PriorityBadge: React.FC<{ priority: Contact['priority'] }> = ({ priority }) => {
    const variants = {
      low: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
      medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      urgent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    };

    return (
      <Badge variant="outline" className={cn(variants[priority])}>
        {t(`priority.${priority}`)}
      </Badge>
    );
  };

  // Filter handlers
  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      status: 'all',
      priority: 'all',
      country: '',
      search: ''
    });
  };

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
            <p className="text-muted-foreground">
              {t('subtitle', { count: totalCount })}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadContacts()}
              disabled={loading}
            >
              <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
              {t('refresh')}
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              {t('export')}
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" />
              {t('filters')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">{t('search')}</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder={t('searchPlaceholder')}
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t('statusFilter')}</Label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => handleFilterChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('allStatuses')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('allStatuses')}</SelectItem>
                    <SelectItem value="new">{t('status.new')}</SelectItem>
                    <SelectItem value="in_progress">{t('status.in_progress')}</SelectItem>
                    <SelectItem value="resolved">{t('status.resolved')}</SelectItem>
                    <SelectItem value="closed">{t('status.closed')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t('priorityFilter')}</Label>
                <Select
                  value={filters.priority}
                  onValueChange={(value) => handleFilterChange('priority', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('allPriorities')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('allPriorities')}</SelectItem>
                    <SelectItem value="low">{t('priority.low')}</SelectItem>
                    <SelectItem value="medium">{t('priority.medium')}</SelectItem>
                    <SelectItem value="high">{t('priority.high')}</SelectItem>
                    <SelectItem value="urgent">{t('priority.urgent')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t('countryFilter')}</Label>
                <Input
                  placeholder={t('filterByCountry')}
                  value={filters.country}
                  onChange={(e) => handleFilterChange('country', e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                disabled={
                  filters.status === 'all' &&
                  filters.priority === 'all' &&
                  !filters.country &&
                  !filters.search
                }
              >
                {t('clearFilters')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contacts Table */}
      <Card>
        <CardContent className="p-0">
          <div className="relative">
            {loading && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('contact')}</TableHead>
                  <TableHead>{t('message')}</TableHead>
                  <TableHead>{t('statusHeader')}</TableHead>
                  <TableHead>{t('priorityHeader')}</TableHead>
                  <TableHead>{t('country')}</TableHead>
                  <TableHead>{t('date')}</TableHead>
                  <TableHead className="text-right">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.length === 0 && !loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {t('noContacts')}
                    </TableCell>
                  </TableRow>
                ) : (
                  contacts.map((contact) => (
                    <TableRow key={contact._id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{contact.fullName}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {contact.email}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {contact.countryCode} {contact.phoneNumber}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px]">
                          <p className="text-sm truncate">{contact.message}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={contact.status} />
                      </TableCell>
                      <TableCell>
                        <PriorityBadge priority={contact.priority} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3" />
                          {contact.country}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {new Date(contact.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              disabled={actionLoading === contact._id}
                            >
                              {actionLoading === contact._id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <MoreHorizontal className="h-4 w-4" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>{t('actions')}</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedContact(contact);
                                setShowDetailsDialog(true);
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              {t('viewDetails')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedContact(contact);
                                setShowNoteDialog(true);
                              }}
                            >
                              <MessageSquare className="mr-2 h-4 w-4" />
                              {t('addNote')}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleStatusUpdate(contact._id, 'in_progress')}
                              disabled={contact.status === 'in_progress'}
                            >
                              <Clock className="mr-2 h-4 w-4" />
                              {t('markInProgress')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleStatusUpdate(contact._id, 'resolved')}
                              disabled={contact.status === 'resolved'}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              {t('markResolved')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleStatusUpdate(contact._id, 'closed')}
                              disabled={contact.status === 'closed'}
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              {t('markClosed')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) handlePageChange(currentPage - 1);
                  }}
                  className={currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>

              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let pageNum;
                if (totalPages <= 7) {
                  pageNum = i + 1;
                } else {
                  if (currentPage <= 4) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 3) {
                    pageNum = totalPages - 6 + i;
                  } else {
                    pageNum = currentPage - 3 + i;
                  }
                }

                if (pageNum === currentPage) {
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink href="#" isActive>
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                }

                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(pageNum);
                      }}
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < totalPages) handlePageChange(currentPage + 1);
                  }}
                  className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Contact Details Dialog */}
      <Dialog
        open={showDetailsDialog}
        onOpenChange={(open) => {
          setShowDetailsDialog(open);
          if (!open) {
            clearQueryParams();
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('contactDetails')}</DialogTitle>
            <DialogDescription>
              {t('contactDetailsSubtitle')}
            </DialogDescription>
          </DialogHeader>

          {selectedContact && (
            <div className="space-y-6">
              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t('contactInfo')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        {t('fullName')}
                      </Label>
                      <p className="mt-1 break-words">{selectedContact.fullName}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        {t('email')}
                      </Label>
                      <p className="mt-1 break-all text-sm">{selectedContact.email}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        {t('phone')}
                      </Label>
                      <p className="mt-1 break-words">{selectedContact.countryCode} {selectedContact.phoneNumber}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        {t('country')}
                      </Label>
                      <p className="mt-1 break-words">{selectedContact.country}</p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      {t('message')}
                    </Label>
                    <p className="mt-1 p-3 bg-muted rounded-md">{selectedContact.message}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        {t('statusHeader')}
                      </Label>
                      <div className="mt-1">
                        <StatusBadge status={selectedContact.status} />
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        {t('priorityHeader')}
                      </Label>
                      <div className="mt-1">
                        <PriorityBadge priority={selectedContact.priority} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Technical Information */}
              {(selectedContact.deviceInfo || selectedContact.ipAddress || selectedContact.location) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t('technicalInfo')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {selectedContact.ipAddress && (
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">
                            {t('ipAddress')}
                          </Label>
                          <p className="mt-1 font-mono text-xs break-all">{selectedContact.ipAddress}</p>
                        </div>
                      )}
                      {selectedContact.deviceInfo?.platform && (
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">
                            {t('platform')}
                          </Label>
                          <p className="mt-1 break-words">{selectedContact.deviceInfo.platform}</p>
                        </div>
                      )}
                      {selectedContact.location?.country && (
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">
                            {t('detectedLocation')}
                          </Label>
                          <p className="mt-1 break-words">
                            {selectedContact.location.city}, {selectedContact.location.country}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Admin Notes */}
              {selectedContact.adminNotes && selectedContact.adminNotes.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t('adminNotes')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedContact.adminNotes.map((note, index) => (
                        <div key={index} className="border-l-2 border-muted pl-4">
                          <p className="text-sm">{note.note}</p>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {t('noteBy', { name: note.createdBy.name })} • {' '}
                            {new Date(note.createdAt).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Timestamps */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t('timestamps')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        {t('submittedAt')}
                      </Label>
                      <p className="mt-1 break-words">{new Date(selectedContact.createdAt).toLocaleString()}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        {t('lastUpdated')}
                      </Label>
                      <p className="mt-1 break-words">{new Date(selectedContact.updatedAt).toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Note Dialog */}
      <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('addNote')}</DialogTitle>
            <DialogDescription>
              {t('addNoteSubtitle', { name: selectedContact?.fullName || '' })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="note">{t('note')}</Label>
              <Textarea
                id="note"
                placeholder={t('notePlaceholder')}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowNoteDialog(false);
                setNoteText('');
              }}
              disabled={actionLoading === 'note'}
            >
              {t('cancel')}
            </Button>
            <Button
              onClick={handleAddNote}
              disabled={!noteText.trim() || actionLoading === 'note'}
            >
              {actionLoading === 'note' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('adding')}
                </>
              ) : (
                <>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  {t('addNote')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContactManagementTable;