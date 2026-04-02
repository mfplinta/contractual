import { useClients } from "../hooks";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { setClientsSearchQuery } from "../../materials/materialSlice";
import { Link, useNavigate } from "react-router";
import {
  Plus,
  Edit,
  MapPin,
  Phone,
  Mail,
  MessageSquare,
  Navigation,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { ClientRead } from "@/services/generatedApi";
import { FilterBar } from "@/components/shared/FilterBar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Helmet } from "react-helmet";
import { useFuse } from "@/hooks/useFuse";

export const ClientsPage = () => {
  const { clients, deleteClient } = useClients();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const clientsSearchQuery = useAppSelector(
    (state) => state.ui.clientsSearchQuery,
  );

  const handleEditClient = (client: ClientRead) => {
    navigate(`/clients/${client.id}/edit`, { state: { client } });
  };

  const handleDeleteClient = (clientId: number) => {
    const shouldDelete = window.confirm(
      "Delete this client? This action cannot be undone.",
    );
    if (!shouldDelete) return;
    deleteClient(clientId);
  };

  const searchClients = useFuse(clients, [
    { name: "name", weight: 2 },
    { name: "email", weight: 1 },
    { name: "phone", weight: 1 },
    { name: "address", weight: 1 },
  ]);
  const filteredClients = searchClients(clientsSearchQuery);

  return (
    <div>
      <Helmet>
        <title>Clients | Contractual</title>
      </Helmet>
      <div className="flex items-center justify-between h-12 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
        <Link
          to="/clients/new"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-[var(--accent-fg-600)] bg-[var(--accent-600)] hover:bg-[var(--accent-700)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent-500)]"
        >
          <Plus className="-ml-1 mr-2 h-5 w-5" />
          New Client
        </Link>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <FilterBar
          placeholder="Search clients..."
          onSearchChange={(query) => dispatch(setClientsSearchQuery(query))}
          searchValue={clientsSearchQuery}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredClients.map((client) => (
          <div
            key={client.id}
            className="bg-white overflow-hidden shadow rounded-lg border border-gray-200 flex flex-col"
          >
            <div className="px-4 py-5 sm:p-6 flex-1">
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-medium leading-6 text-gray-900 truncate">
                    {client.name}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 truncate">
                    {client.email}
                  </p>

                  <div className="mt-4 space-y-2">
                    {client.phone && (
                      <div className="flex items-center text-sm text-gray-500">
                        <Phone className="h-4 w-4 mr-2 text-gray-400" />
                        {client.phone}
                      </div>
                    )}
                    {(client.address || client.city || client.state) && (
                      <div className="flex items-center text-sm text-gray-500">
                        <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                        {client.address && `${client.address}, `}
                        {client.city}
                        {client.city && client.state && ", "}
                        {client.state}
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  tooltip="Edit"
                  onClick={() => handleEditClient(client)}
                  aria-label="Edit"
                >
                  <Edit className="h-4 w-4 text-gray-400" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  tooltip="Delete"
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  aria-label="Delete"
                  onClick={() => handleDeleteClient(client.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-4 sm:px-6 flex justify-between items-center">
              <div className="text-sm">
                <Link
                  to={`/lists?client=${client.id}`}
                  className="font-medium text-gray-700 hover:text-gray-900"
                >
                  View Jobs
                </Link>
              </div>

              {/* Action Icons - Horizontal */}
              <div className="flex gap-3">
                {client.email && (
                  <AWithTooltip
                    tooltip="Email"
                    href={`mailto:${client.email}`}
                    icon={<Mail className="h-4 w-4" />}
                  />
                )}
                {client.phone && (
                  <>
                    <AWithTooltip
                      tooltip="Call"
                      href={`tel:${client.phone}`}
                      icon={<Phone className="h-4 w-4" />}
                    />
                    <AWithTooltip
                      tooltip="Text"
                      href={`sms:${client.phone}`}
                      icon={<MessageSquare className="h-4 w-4" />}
                    />
                  </>
                )}
                {client.address && (
                  <AWithTooltip
                    tooltip="Navigate"
                    targetBlank={true}
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      `${client.address} ${client.city} ${client.state}`,
                    )}`}
                    icon={<Navigation className="h-4 w-4" />}
                  />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AWithTooltip = ({
  tooltip,
  href,
  targetBlank,
  icon,
}: {
  tooltip: string;
  href: string;
  targetBlank?: boolean;
  icon: React.ReactNode;
}) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <a
        href={href}
        target={targetBlank ? "_blank" : "_self"}
        className="inline-flex items-center justify-center h-8 w-8 rounded-md text-gray-400 hover:text-[var(--accent-600)] hover:bg-[var(--accent-50)] transition-colors"
        aria-label={tooltip}
      >
        {icon}
      </a>
    </TooltipTrigger>
    <TooltipContent side="top">{tooltip}</TooltipContent>
  </Tooltip>
);
