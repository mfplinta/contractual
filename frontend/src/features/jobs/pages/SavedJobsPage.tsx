import React, { useEffect, useMemo, useState } from 'react';
import { useJobs } from '../hooks';
import { useClients } from '@/features/clients/hooks';
import { useCart } from '@/features/cart/hooks';
import { Calendar, User, Trash2, Filter as FilterIcon, ArrowUpDown } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { FilterBar, FilterItem } from '@/components/shared/FilterBar';
import { DataTable } from '@/components/shared/DataTable';
import type { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/Button';
import { Helmet } from 'react-helmet';
import { useFuse } from '@/hooks/useFuse';

export const SavedJobsPage = () => {
  const { jobs, deleteJob } = useJobs();
  const { clients } = useClients();
  const { currentJobId } = useCart();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
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

  // Build a searchable list that includes the resolved client name
  const jobsWithClientName = useMemo(
    () => jobs.map(job => ({
      ...job,
      _clientName: job.client?.name ?? 'Unknown Client',
      _clientId: String(job.client?.id ?? ''),
      _jobId: String(job.id),
    })),
    [jobs, clients]
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

  const jobColumns: ColumnDef<typeof jobsWithClientName[number]>[] = useMemo(() => [
    {
      accessorKey: 'description',
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="text-left hover:text-gray-700 flex items-center gap-1 w-full uppercase text-[12px]"
        >
          Job Name
          <ArrowUpDown className="h-3.5 w-3.5" />
        </button>
      ),
      minSize: 120,
      cell: ({ row }) => (
        <p className="text-sm font-medium text-gray-900 truncate max-w-full">{row.original.description}</p>
      ),
    },
    {
      accessorKey: '_clientName',
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="text-left hover:text-gray-700 flex items-center gap-1 w-full uppercase text-[12px]"
        >
          Client
          <ArrowUpDown className="h-3.5 w-3.5" />
        </button>
      ),
      cell: ({ row }) => (
        <div className="text-sm text-gray-500 flex items-center min-w-0">
          <User className="h-4 w-4 mr-1.5 text-gray-400 flex-none" />
          <span className="truncate">{row.original.client?.name ?? 'Unknown Client'}</span>
        </div>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="text-left hover:text-gray-700 flex items-center gap-1 w-full uppercase text-[12px]"
        >
          Created
          <ArrowUpDown className="h-3.5 w-3.5" />
        </button>
      ),
      size: 140,
      cell: ({ row }) => (
        <div className="text-sm text-gray-500 flex items-center">
          <Calendar className="h-4 w-4 mr-1.5 text-gray-400 flex-none" />
          {row.original.createdAt ? format(new Date(row.original.createdAt), 'PP') : '—'}
        </div>
      ),
    },
    {
      id: 'actions',
      size: 40,
      header: () => null,
      cell: ({ row }) => {
        const job = row.original;
        return (
          <div className="flex justify-end">
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
        );
      },
    },
  ], []);

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

      <DataTable
        columns={jobColumns}
        data={filteredJobs}
        initialSorting={[{ id: 'createdAt', desc: true }]}
        onRowClick={(job) => handleViewEdit(job.id)}
        noResultsMessage={selectedFilters.length > 0 || searchQuery ? 'No jobs match your filters.' : 'No saved jobs found.'}
      />
    </div>
  );
};