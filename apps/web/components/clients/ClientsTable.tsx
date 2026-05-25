'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRightIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';
import { Client } from '@massage/types';
import { APT_COLORS, APT_SOFT } from '@/lib/appointment-colors';

export interface ClientsTableProps {
  clients: Client[];
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  total?: number;
}

const APT_PALETTE = APT_COLORS.map((c, i) => ({ bg: APT_SOFT[i], text: c }));

function getAptColor(name: string) {
  const idx = (name.charCodeAt(0) + (name.charCodeAt(1) || 0)) % APT_PALETTE.length;
  return APT_PALETTE[idx];
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
}

function getClientTags(client: Client): { label: string; isVip: boolean }[] {
  const tags: { label: string; isVip: boolean }[] = [];
  if (client.totalVisits >= 10) tags.push({ label: 'VIP', isVip: true });
  if (!client.isActive) tags.push({ label: 'Inactive', isVip: false });
  if (client.allergies.length > 0) tags.push({ label: 'Allergies', isVip: false });
  return tags;
}

function formatDate(date: Date | string | null | undefined) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const HEADER_STYLE: React.CSSProperties = {
  fontSize: '10.5px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '1px',
  color: '#7A7090',
  padding: '10px 16px',
  borderBottom: '1px solid #EFE9F2',
  background: '#FAFAF9',
  whiteSpace: 'nowrap',
};

export const ClientsTable: React.FC<ClientsTableProps> = ({
  clients,
  totalPages,
  currentPage,
  onPageChange,
  total,
}) => {
  const router = useRouter();

  if (clients.length === 0) {
    return (
      <div
        style={{
          background: '#fff',
          borderRadius: 18,
          border: '1px solid #EFE9F2',
          overflow: 'hidden',
          padding: '48px 24px',
          textAlign: 'center',
        }}
      >
        <p style={{ color: '#7A7090', fontSize: 14 }}>No clients found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        style={{
          background: '#fff',
          borderRadius: 18,
          border: '1px solid #EFE9F2',
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ ...HEADER_STYLE, textAlign: 'left' }}>Client</th>
              <th style={{ ...HEADER_STYLE, textAlign: 'left' }}>Tags</th>
              <th style={{ ...HEADER_STYLE, textAlign: 'left' }}>Last visit</th>
              <th style={{ ...HEADER_STYLE, textAlign: 'right' }}>Lifetime $</th>
              <th style={{ ...HEADER_STYLE, textAlign: 'right' }}>Visits</th>
              <th style={{ ...HEADER_STYLE, textAlign: 'left' }}>Next session</th>
              <th style={{ ...HEADER_STYLE, width: 32 }} />
            </tr>
          </thead>
          <tbody>
            {clients.map((client, i) => {
              const color = getAptColor(`${client.firstName}${client.lastName}`);
              const initials = getInitials(client.firstName, client.lastName);
              const tags = getClientTags(client);
              const therapist = (client as any).preferredTherapist;
              const therapistName = therapist?.user
                ? `${therapist.user.firstName ?? ''} ${therapist.user.lastName ?? ''}`.trim()
                : null;

              return (
                <tr
                  key={client.id}
                  onClick={() => router.push(`/clients/${client.id}`)}
                  style={{
                    borderTop: i === 0 ? 'none' : '1px solid #EFE9F2',
                    cursor: 'pointer',
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#FAFAF9')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  {/* Client cell */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: color.bg,
                          color: color.text,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 600,
                          fontSize: 13,
                          flexShrink: 0,
                        }}
                      >
                        {initials}
                      </div>
                      <div>
                        <p style={{ fontSize: 13.5, fontWeight: 500, color: '#1E1830', margin: 0 }}>
                          {client.firstName} {client.lastName}
                        </p>
                        {therapistName && (
                          <p style={{ fontSize: 11.5, color: '#7A7090', margin: 0 }}>
                            {therapistName}
                          </p>
                        )}
                        {!therapistName && client.email && (
                          <p style={{ fontSize: 11.5, color: '#7A7090', margin: 0 }}>
                            {client.email}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Tags */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {tags.length === 0 && (
                        <span style={{ fontSize: 12, color: '#7A7090' }}>—</span>
                      )}
                      {tags.map((tag) => (
                        <span
                          key={tag.label}
                          style={{
                            fontSize: 11.5,
                            fontWeight: 500,
                            padding: '2px 8px',
                            borderRadius: 999,
                            background: tag.isVip ? '#F7E5DD' : '#EDE5F4',
                            color: tag.isVip ? '#C97E68' : '#5D4AA8',
                          }}
                        >
                          {tag.label}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Last visit */}
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#3D3450' }}>
                    {formatDate(client.lastVisitDate)}
                  </td>

                  {/* Lifetime $ */}
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#3D3450', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    —
                  </td>

                  {/* Visits */}
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#3D3450', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
                    {client.totalVisits}
                  </td>

                  {/* Next session */}
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#7A7090' }}>
                    —
                  </td>

                  {/* Chevron */}
                  <td style={{ padding: '12px 12px 12px 0', textAlign: 'center' }}>
                    <ChevronRightIcon style={{ width: 16, height: 16, color: '#7A7090' }} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 14px',
              borderRadius: 999,
              border: '1px solid #E5DEEC',
              background: '#fff',
              fontSize: 13,
              fontWeight: 500,
              color: currentPage === 1 ? '#7A7090' : '#3D3450',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              opacity: currentPage === 1 ? 0.5 : 1,
            }}
          >
            <ChevronLeftIcon style={{ width: 14, height: 14 }} />
            Previous
          </button>

          <span style={{ fontSize: 13, color: '#7A7090' }}>
            Page <span style={{ color: '#1E1830', fontWeight: 500 }}>{currentPage}</span> of {totalPages}
            {total !== undefined && (
              <span style={{ marginLeft: 6 }}>· {total.toLocaleString()} clients</span>
            )}
          </span>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 14px',
              borderRadius: 999,
              background: currentPage === totalPages ? '#E5DEEC' : 'linear-gradient(135deg, #5D4AA8, #3F2F87)',
              border: 'none',
              fontSize: 13,
              fontWeight: 500,
              color: currentPage === totalPages ? '#7A7090' : '#fff',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              opacity: currentPage === totalPages ? 0.5 : 1,
              boxShadow: currentPage === totalPages ? 'none' : '0 4px 12px #5D4AA833',
            }}
          >
            Next
            <ChevronRightIcon style={{ width: 14, height: 14 }} />
          </button>
        </div>
      )}
    </div>
  );
};
