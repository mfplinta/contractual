import React, { useEffect, useMemo, useState } from 'react';
import { useJobs } from '../hooks';
import { useClients } from '@/features/clients/hooks';
import { useCart } from '@/features/cart/hooks';
import { Calendar, User, Trash2, Filter as FilterIcon, Eye } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { FilterBar, FilterItem } from '@/components/shared/FilterBar';
import { ResponsiveTable, ResponsiveTableCell } from '@/components/shared/ResponsiveTable';
import { TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/Button';
import { Helmet } from 'react-helmet';
import { useFuse } from '@/hooks/useFuse';

export const SavedJobsPage = () => {
  const { jobs, deleteJob } = useJobs();
  const { clients } = useClients();
  const { currentJobId } = useCart();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [sortField, setSortField] = useState<'description' | 'client' | 'createdAt'>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');

  // Resolve the client filter from ?client= whenever URL or clients change.
  const urlClientFilter = useMemo<FilterItem | null>(() => {
    const clientId = searchParams.get('client');
    if (!clientId) return null;
    const client = clients.find(c => String(c.id) === clientId);
    if (!client) return null;
    return { id: String(client.id), name: client.name, type: 'client' as const };
  }, [searchParams, clients]);

  const [selectedFilters, setSelectedFilters] = useState<FilterItem[]>([]);

  useEffect(() => {
    setSelectedFilters(prev => {
      const nonClientFilters = prev.filter(filter => filter.type !== 'client');

      if (!urlClientFilter) {
        return nonClientFilters.length === prev.length ? prev : nonClientFilters;
      }

      const alreadySelected = prev.some(
        filter => filter.type === 'client' && filter.id === urlClientFilter.id
      );
      const hasOtherClient = prev.some(
        filter => filter.type === 'client' && filter.id !== urlClientFilter.id
      );

      if (alreadySelected && !hasOtherClient) {
        return prev;
      }

      return [...nonClientFilters, urlClientFilter];
    });
  }, [urlClientFilter]);

  // Keep the URL in sync: clear the param once filters change away from the initial
  const handleFiltersChange = (filters: FilterItem[]) => {
    setSelectedFilters(filters);
    const clientFilter = filters.find(f => f.type === 'client');
    if (clientFilter) {
      setSearchParams({ client: String(clientFilter.id) }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  const handleSort = (field: 'description' | 'client' | 'createdAt') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedJobs = [...jobs]
    .sort((a, b) => {
    let aVal: any;
    let bVal: any;
    
    if (sortField === 'client') {
      aVal = a.client?.name ?? '';
      bVal = b.client?.name ?? '';
    } else {
      aVal = a[sortField];
      bVal = b[sortField];
    }
    
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Build a searchable list that includes the resolved client name
  const jobsWithClientName = useMemo(
    () => sortedJobs.map(job => ({
      ...job,
      _clientName: job.client?.name ?? 'Unknown Client',
      _clientId: String(job.client?.id ?? ''),
      _jobId: String(job.id),
    })),
    [sortedJobs, clients]
  );

  const searchJobs = useFuse(jobsWithClientName, [
    'description',
    '_clientName',
    '_clientId',
    '_jobId',
  ]);

  // Filter jobs based on search query and selected filters
  const filteredJobs = useMemo(() => {
    const clientFilters = selectedFilters.filter(f => f.type === 'client');
    const jobFilters = selectedFilters.filter(f => f.type === 'job');
    const hasQuery = searchQuery.length > 0;
    const hasFilters = clientFilters.length > 0 || jobFilters.length > 0;

    if (!hasQuery && !hasFilters) return jobsWithClientName;

    // Build Fuse extended-search expression
    const conditions: any[] = [];

    // Fuzzy text search across description & client name
    if (hasQuery) {
      conditions.push({
        $or: [
          { description: searchQuery },
          { _clientName: searchQuery },
        ],
      });
    }

    // Exact-match client filters (OR between selected clients)
    if (clientFilters.length > 0) {
      conditions.push({
        $or: clientFilters.map(f => ({ _clientId: `'${f.id}` })),
      });
    }

    // Exact-match job filters (OR between selected jobs)
    if (jobFilters.length > 0) {
      conditions.push({
        $or: jobFilters.map(f => ({ _jobId: `'${f.id}` })),
      });
    }

    const expression = conditions.length === 1 ? conditions[0] : { $and: conditions };
    return searchJobs.fuse.search(expression).map(r => r.item);
  }, [searchQuery, searchJobs, jobsWithClientName, selectedFilters]);

  // Prepare filter items (both clients and jobs), excluding the current cart job
  const filterItems: FilterItem[] = [
    ...clients.map(client => ({
      id: String(client.id),
      name: client.name,
      type: 'client' as const
    })),
    ...jobs.filter(job => job.id !== currentJobId).map(job => ({
      id: String(job.id),
      name: job.description,
      type: 'job' as const
    }))
  ];

  const handleViewEdit = (jobId: number) => {
    navigate('/cart', { state: { jobId } });
  };

  return (
    <div>
      <Helmet>
        <title>Saved Jobs | Contractual</title>
      </Helmet>
      <div className="flex items-center justify-between h-12 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Saved Jobs</h1>
        <div />
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <FilterBar
          placeholder="Search jobs by name or client..."
          items={filterItems}
          selectedFilters={selectedFilters}
          onFiltersChange={handleFiltersChange}
          onSearchChange={setSearchQuery}
          suggestionIcon={FilterIcon}
        />
      </div>

      <ResponsiveTable
        columns={[
          {
            key: 'description',
            label: 'Job Name',
            expand: true,
            minWidth: '160px',
            onSort: () => handleSort('description'),
            sortDirection: sortField === 'description' ? sortDirection : null,
          },
          {
            key: 'client',
            label: 'Client',
            minWidth: '120px',
            width: 200,
            onSort: () => handleSort('client'),
            sortDirection: sortField === 'client' ? sortDirection : null,
          },
          {
            key: 'created',
            label: 'Created',
            minWidth: '120px',
            width: 160,
            onSort: () => handleSort('createdAt'),
            sortDirection: sortField === 'createdAt' ? sortDirection : null,
          },
          {
            key: 'actions',
            label: '',
            align: 'right',
            keepRight: true,
            width: 100,
            minWidth: '80px',
          },
        ]}
      >
        {filteredJobs.length === 0 ? (
          <TableRow>
            <ResponsiveTableCell colSpan={4} className="px-4 py-12 text-center text-sm text-gray-500">
              {selectedFilters.length > 0 || searchQuery ? 'No jobs match your filters.' : 'No saved jobs found.'}
            </ResponsiveTableCell>
          </TableRow>
        ) : (
          filteredJobs.map(job => (
            <TableRow key={job.id} className="hover:bg-gray-50 transition-colors">
              <ResponsiveTableCell columnKey="description" className="px-4 py-3">
                <p className="text-sm font-medium text-gray-900 truncate">{job.description}</p>
              </ResponsiveTableCell>
              <ResponsiveTableCell columnKey="client" className="px-4 py-3">
                <div className="text-sm text-gray-500 flex items-center">
                  <User className="h-4 w-4 mr-1.5 text-gray-400 flex-none" />
                  <span className="truncate">{job.client?.name ?? 'Unknown Client'}</span>
                </div>
              </ResponsiveTableCell>
              <ResponsiveTableCell columnKey="created" className="px-4 py-3">
                <div className="text-sm text-gray-500 flex items-center">
                  <Calendar className="h-4 w-4 mr-1.5 text-gray-400 flex-none" />
                  {job.createdAt ? format(new Date(job.createdAt), 'PP') : '—'}
                </div>
              </ResponsiveTableCell>
              <ResponsiveTableCell columnKey="actions" className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    tooltip="View & Edit"
                    onClick={(event: React.MouseEvent) => {
                      event.stopPropagation();
                      handleViewEdit(job.id);
                    }}
                    className="text-[var(--accent-600)] hover:text-[var(--accent-900)] min-h-9 min-w-9 p-2"
                    aria-label="View & Edit"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    tooltip="Delete"
                    onClick={(event: React.MouseEvent) => {
                      event.stopPropagation();
                      if (confirm('Are you sure you want to delete this job?')) {
                        deleteJob(job.id);
                      }
                    }}
                    className="text-red-400 hover:text-red-600 min-h-9 min-w-9 p-2"
                    aria-label="Delete Job"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </ResponsiveTableCell>
            </TableRow>
          ))
        )}
      </ResponsiveTable>
    </div>
  );
};