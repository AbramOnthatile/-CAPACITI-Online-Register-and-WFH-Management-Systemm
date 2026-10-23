import { useState } from 'react';
import { icons } from '../icons';
import { Avatar, Countdown, StatCard, Table } from './data-display';
import {
  Badge,
  EmptyState,
  ErrorState,
  ProgressBar,
  Skeleton,
  StatusBadge,
} from './feedback';
import { Button, Card } from './button';
import { Field, Input, Select, Textarea } from './fields';
import { BottomSheet, Modal, ToastProvider, useToast } from './overlays';
import { PageHeader, SegmentedControl, Tabs } from './navigation';

type PreviewRow = {
  id: string;
  name: string;
  status: 'ON_TIME' | 'LATE_UNEXCUSED';
};

const previewRows: PreviewRow[] = [
  { id: '1', name: 'Sam Dlamini', status: 'ON_TIME' },
  { id: '2', name: 'Taylor Mokoena', status: 'LATE_UNEXCUSED' },
];

const previewColumns = [
  {
    key: 'name',
    header: 'Name',
    render: (row: PreviewRow) => row.name,
  },
  {
    key: 'status',
    header: 'Status',
    render: (row: PreviewRow) => (
      <StatusBadge category="arrival" status={row.status} />
    ),
  },
];

function KitPreviewContent() {
  const [activeTab, setActiveTab] = useState('overview');
  const [segment, setSegment] = useState('week');
  const [modalOpen, setModalOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [countdownStart] = useState(() => Date.now());
  const [textareaValue, setTextareaValue] = useState('');
  const { showToast } = useToast();

  return (
    <main className="min-h-screen bg-surface px-4 py-6 text-ink-900 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <PageHeader
          eyebrow="Development preview"
          title="UI kit"
          description="Responsive, reusable components for the CAPACITI operations platform."
          actions={
            <Button
              variant="secondary"
              onClick={() =>
                showToast({
                  title: 'Preview toast',
                  message: 'Toast notifications are ready.',
                  tone: 'success',
                })
              }
            >
              Show toast
            </Button>
          }
        />

        <section aria-labelledby="kit-actions">
          <h2 id="kit-actions" className="mb-3 font-display text-lg font-semibold">
            Buttons and badges
          </h2>
          <Card className="flex flex-wrap items-center gap-3">
            <Button>Primary</Button>
            <Button variant="secondary" size="sm">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
            <Button size="lg" loading>Loading</Button>
            <Badge tone="success" icon={icons.check}>Success</Badge>
            <Badge tone="warning" icon={icons.warning}>Warning</Badge>
            <Badge tone="info">Info</Badge>
            <Badge tone="neutral">Neutral</Badge>
            <StatusBadge category="wfh" status="APPROVED" />
            <StatusBadge category="ticket" status="OPEN" />
          </Card>
        </section>

        <section aria-labelledby="kit-cards">
          <h2 id="kit-cards" className="mb-3 font-display text-lg font-semibold">
            Cards and stats
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <p className="font-semibold">Card</p>
              <p className="mt-1 text-sm text-ink-500">A flexible content surface.</p>
            </Card>
            <StatCard
              label="Attendance"
              value="96%"
              hint="This month"
              icon={icons.attendance}
              trend={{ value: '+4%', label: 'from last month', direction: 'up' }}
            />
            <div className="flex items-center gap-3">
              <Avatar name="Sam Dlamini" size="sm" />
              <Avatar name="Taylor Mokoena" />
              <Avatar name="Avery Ndlovu" size="lg" />
            </div>
          </div>
        </section>

        <section aria-labelledby="kit-fields">
          <h2 id="kit-fields" className="mb-3 font-display text-lg font-semibold">
            Fields
          </h2>
          <Card className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Search"
              placeholder="Search records"
              type="search"
              hint="Search by name or reference."
            />
            <Select
              label="Work mode"
              placeholder="Choose a mode"
              options={[
                { value: 'ON_SITE', label: 'On-site' },
                { value: 'WFH', label: 'Work from home' },
              ]}
            />
            <Textarea
              label="Notes"
              value={textareaValue}
              onChange={(event) => setTextareaValue(event.currentTarget.value)}
              maxLength={160}
              hint="Textarea includes a live character count."
              containerClassName="sm:col-span-2"
            />
            <Field id="kit-field-example" label="Field wrapper" hint="Use to compose custom labelled controls.">
              <Input id="kit-field-example" aria-label="Custom field control" />
            </Field>
          </Card>
        </section>

        <section aria-labelledby="kit-navigation">
          <h2 id="kit-navigation" className="mb-3 font-display text-lg font-semibold">
            Navigation and layout
          </h2>
          <Card className="space-y-5">
            <Tabs
              ariaLabel="Preview tabs"
              value={activeTab}
              onChange={setActiveTab}
              items={[
                { value: 'overview', label: 'Overview', content: <p className="text-sm text-ink-700">Overview tab content.</p> },
                { value: 'activity', label: 'Activity', content: <p className="text-sm text-ink-700">Activity tab content.</p> },
              ]}
            />
            <SegmentedControl
              ariaLabel="Report period"
              value={segment}
              onChange={setSegment}
              options={[
                { value: 'week', label: 'Week' },
                { value: 'month', label: 'Month' },
                { value: 'year', label: 'Year' },
              ]}
            />
          </Card>
        </section>

        <section aria-labelledby="kit-table">
          <h2 id="kit-table" className="mb-3 font-display text-lg font-semibold">
            Table
          </h2>
          <Table
            caption="Sample attendance"
            columns={previewColumns}
            rows={previewRows}
            rowKey={(row) => row.id}
          />
        </section>

        <section aria-labelledby="kit-states">
          <h2 id="kit-states" className="mb-3 font-display text-lg font-semibold">
            Loading and feedback states
          </h2>
          <Card className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-3">
              <Skeleton className="w-2/3" />
              <Skeleton variant="rectangular" />
              <Skeleton variant="circular" />
            </div>
            <EmptyState
              title="Nothing here yet"
              description="New items will appear here when available."
              icon={icons.reports}
              action={{ label: 'Refresh', onClick: () => showToast({ title: 'Refreshed' }) }}
            />
            <ErrorState
              description="We could not load this preview."
              onRetry={() => showToast({ title: 'Retry requested', tone: 'info' })}
            />
            <div className="space-y-4 py-4">
              <ProgressBar value={68} label="Completion" showValue />
              <ProgressBar value={4} max={5} label="Weekly target" tone="success" showValue />
              <Countdown
                expiresAt={countdownStart + 5 * 60_000}
                serverTime={countdownStart}
                onExpire={() => showToast({ title: 'Countdown finished', tone: 'warning' })}
              />
            </div>
          </Card>
        </section>

        <section aria-labelledby="kit-overlays">
          <h2 id="kit-overlays" className="mb-3 font-display text-lg font-semibold">
            Dialogs
          </h2>
          <Card className="flex flex-wrap gap-3">
            <Button onClick={() => setModalOpen(true)}>Open modal</Button>
            <Button variant="secondary" onClick={() => setSheetOpen(true)}>
              Open responsive bottom sheet
            </Button>
          </Card>
        </section>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Modal"
        description="Centered dialog for desktop and mobile."
        footer={
          <Button onClick={() => setModalOpen(false)}>Done</Button>
        }
      >
        <p className="text-sm text-ink-700">The dialog traps focus and closes with Escape.</p>
      </Modal>
      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Bottom sheet"
        description="This becomes a centered modal on desktop."
        footer={
          <Button onClick={() => setSheetOpen(false)}>Close</Button>
        }
      >
        <p className="text-sm text-ink-700">Swipe-independent controls stay reachable at mobile widths.</p>
      </BottomSheet>
    </main>
  );
}

export function KitPreview() {
  return (
    <ToastProvider>
      <KitPreviewContent />
    </ToastProvider>
  );
}
