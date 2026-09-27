import { connectDB, disconnectDB } from './mongoose.js';
import { ComponentModel, ComponentBundleModel } from '../models/index.js';
import { storeBundleFiles } from '../storage/gridfs.js';

export async function seedSalesCRMComponents() {
  console.log('Connecting to MongoDB for Sales CRM components seeding...');
  await connectDB();

  try {
    // ------------------------------------------------------------------------
    // 1. FREE: Win Probability Meter (Data Display)
    // ------------------------------------------------------------------------
    const winProbabilityFiles = [
      {
        path: 'WinProbabilityMeter.tsx',
        content: `import React from 'react';
import './WinProbabilityMeter.css';

export interface WinProbabilityMeterProps {
  value: number; // 0 to 100
  segments?: number; // total segment count, default: 10
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const WinProbabilityMeter: React.FC<WinProbabilityMeterProps> = ({
  value,
  segments = 10,
  size = 'md',
  showLabel = true,
  className = '',
}) => {
  const clamped = Math.max(0, Math.min(100, value));
  const activeSegments = Math.round((clamped / 100) * segments);

  const getSegmentColor = (index: number) => {
    if (index >= activeSegments) return 'var(--crm-segment-inactive, #232D34)';
    const ratio = (index + 1) / segments;
    if (ratio <= 0.35) return 'var(--crm-color-danger, #EF4444)';
    if (ratio <= 0.65) return 'var(--crm-color-warning, #F59E0B)';
    return 'var(--crm-color-success, #10B981)';
  };

  return (
    <div className={\`crm-probability-meter crm-meter-\${size} \${className}\`}>
      <div className="crm-meter-bars" role="progressbar" aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={100}>
        {Array.from({ length: segments }).map((_, i) => (
          <span
            key={i}
            className="crm-meter-segment"
            style={{ backgroundColor: getSegmentColor(i) }}
          />
        ))}
      </div>
      {showLabel && <span className="crm-meter-label">{clamped}%</span>}
    </div>
  );
};
`,
      },
      {
        path: 'WinProbabilityMeter.css',
        content: `.crm-probability-meter {
  display: inline-flex;
  align-items: center;
  gap: 0.625rem;
  font-family: inherit;
}
.crm-meter-bars {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}
.crm-meter-segment {
  width: 3px;
  height: 14px;
  border-radius: 1px;
  transition: background-color 0.2s ease;
}
.crm-meter-sm .crm-meter-segment {
  width: 2.5px;
  height: 10px;
}
.crm-meter-lg .crm-meter-segment {
  width: 4px;
  height: 18px;
}
.crm-meter-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #F9FBFF;
  min-width: 2.25rem;
}
.crm-meter-sm .crm-meter-label { font-size: 0.75rem; }
.crm-meter-lg .crm-meter-label { font-size: 0.9375rem; }
`,
      },
      {
        path: 'index.ts',
        content: `export * from './WinProbabilityMeter';\n`,
      },
    ];

    const winProbStored = await storeBundleFiles('win-probability-meter', '1.0.0', winProbabilityFiles);
    const winProbSize = winProbabilityFiles.reduce((acc, f) => acc + Buffer.byteLength(f.content, 'utf8'), 0);

    const compWinProb = await ComponentModel.findOneAndUpdate(
      { slug: 'win-probability-meter' },
      {
        $set: {
          slug: 'win-probability-meter',
          name: 'Win Probability Meter',
          description: 'Visual multi-segment probability gauge with color-coded score tiers (red, amber, emerald) and percentage readout.',
          category: 'Data Display',
          version: '1.0.0',
          accessLevel: 'free',
          status: 'published',
          props: {
            value: { name: 'value', type: 'number', description: 'Percentage score 0 to 100', required: true, defaultValue: 75 },
            segments: { name: 'segments', type: 'number', description: 'Total vertical bar count', required: false, defaultValue: 10 },
            size: { name: 'size', type: "'sm' | 'md' | 'lg'", description: 'Bar dimensions and text scale', required: false, defaultValue: "'md'" },
            showLabel: { name: 'showLabel', type: 'boolean', description: 'Display percentage number label', required: false, defaultValue: true },
          },
          dependencies: ['react'],
          bundle: {
            version: '1.0.0',
            entryPoint: 'WinProbabilityMeter.tsx',
            totalSize: winProbSize,
            fileCount: winProbabilityFiles.length,
            files: winProbStored,
            uploadedAt: new Date(),
          },
        },
      },
      { upsert: true, returnDocument: 'after' }
    );

    await ComponentBundleModel.findOneAndUpdate(
      { slug: 'win-probability-meter', version: '1.0.0' },
      {
        $set: {
          componentId: compWinProb._id,
          slug: 'win-probability-meter',
          version: '1.0.0',
          entryPoint: 'WinProbabilityMeter.tsx',
          totalSize: winProbSize,
          fileCount: winProbabilityFiles.length,
          files: winProbStored,
          meta: { slug: 'win-probability-meter', version: '1.0.0', accessLevel: 'free', status: 'published' },
        },
      },
      { upsert: true }
    );
    console.log('✓ Seeded component: win-probability-meter (free)');

    // ------------------------------------------------------------------------
    // 2. FREE: Activity Cadence Sparkline (Analytics)
    // ------------------------------------------------------------------------
    const activitySparklineFiles = [
      {
        path: 'ActivitySparklineBar.tsx',
        content: `import React from 'react';
import './ActivitySparklineBar.css';

export interface ActivitySparklineBarProps {
  data?: number[];
  maxBars?: number;
  height?: 'sm' | 'md' | 'lg';
  color?: string;
  interactive?: boolean;
  onBarHover?: (val: number, index: number) => void;
  className?: string;
}

export const ActivitySparklineBar: React.FC<ActivitySparklineBarProps> = ({
  data = [4, 8, 3, 11, 7, 14, 9, 12],
  maxBars = 8,
  height = 'md',
  color = '#10B981',
  interactive = true,
  onBarHover,
  className = '',
}) => {
  const displayData = data.slice(-maxBars);
  const maxVal = Math.max(...displayData, 1);

  return (
    <div className={\`crm-sparkline-bar crm-sparkline-\${height} \${className}\`}>
      {displayData.map((val, idx) => {
        const heightPercent = Math.max(12, Math.round((val / maxVal) * 100));
        return (
          <div
            key={idx}
            className="crm-sparkline-col"
            onMouseEnter={() => onBarHover?.(val, idx)}
            title={interactive ? \`Activity: \${val} actions\` : undefined}
          >
            <div
              className="crm-sparkline-fill"
              style={{
                height: \`\${heightPercent}%\`,
                backgroundColor: color,
              }}
            />
          </div>
        );
      })}
    </div>
  );
};
`,
      },
      {
        path: 'ActivitySparklineBar.css',
        content: `.crm-sparkline-bar {
  display: inline-flex;
  align-items: flex-end;
  gap: 3px;
  height: 20px;
}
.crm-sparkline-sm { height: 14px; gap: 2px; }
.crm-sparkline-lg { height: 28px; gap: 4px; }
.crm-sparkline-col {
  width: 3.5px;
  height: 100%;
  display: flex;
  align-items: flex-end;
  cursor: default;
}
.crm-sparkline-sm .crm-sparkline-col { width: 2.5px; }
.crm-sparkline-lg .crm-sparkline-col { width: 5px; }
.crm-sparkline-fill {
  width: 100%;
  border-radius: 1px;
  opacity: 0.85;
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.crm-sparkline-col:hover .crm-sparkline-fill {
  opacity: 1;
  transform: scaleY(1.08);
}
`,
      },
      {
        path: 'index.ts',
        content: `export * from './ActivitySparklineBar';\n`,
      },
    ];

    const sparklineStored = await storeBundleFiles('activity-sparkline-bar', '1.0.0', activitySparklineFiles);
    const sparklineSize = activitySparklineFiles.reduce((acc, f) => acc + Buffer.byteLength(f.content, 'utf8'), 0);

    const compSparkline = await ComponentModel.findOneAndUpdate(
      { slug: 'activity-sparkline-bar' },
      {
        $set: {
          slug: 'activity-sparkline-bar',
          name: 'Activity Cadence Sparkline',
          description: 'Compact micro bar-chart sparkline visualizing user or deal activity cadence over time with interactive tooltips and height scaling.',
          category: 'Analytics',
          version: '1.0.0',
          accessLevel: 'free',
          status: 'published',
          props: {
            data: { name: 'data', type: 'number[]', description: 'Sequence of activity frequency counts', required: false, defaultValue: '[4, 8, 3, 11, 7, 14, 9, 12]' },
            maxBars: { name: 'maxBars', type: 'number', description: 'Maximum visible columns', required: false, defaultValue: 8 },
            height: { name: 'height', type: "'sm' | 'md' | 'lg'", description: 'Vertical height scaling tier', required: false, defaultValue: "'md'" },
            color: { name: 'color', type: 'string', description: 'Bar fill color CSS string', required: false, defaultValue: "'#10B981'" },
            interactive: { name: 'interactive', type: 'boolean', description: 'Enables hover tooltips', required: false, defaultValue: true },
          },
          dependencies: ['react'],
          bundle: {
            version: '1.0.0',
            entryPoint: 'ActivitySparklineBar.tsx',
            totalSize: sparklineSize,
            fileCount: activitySparklineFiles.length,
            files: sparklineStored,
            uploadedAt: new Date(),
          },
        },
      },
      { upsert: true, returnDocument: 'after' }
    );

    await ComponentBundleModel.findOneAndUpdate(
      { slug: 'activity-sparkline-bar', version: '1.0.0' },
      {
        $set: {
          componentId: compSparkline._id,
          slug: 'activity-sparkline-bar',
          version: '1.0.0',
          entryPoint: 'ActivitySparklineBar.tsx',
          totalSize: sparklineSize,
          fileCount: activitySparklineFiles.length,
          files: sparklineStored,
          meta: { slug: 'activity-sparkline-bar', version: '1.0.0', accessLevel: 'free', status: 'published' },
        },
      },
      { upsert: true }
    );
    console.log('✓ Seeded component: activity-sparkline-bar (free)');

    // ------------------------------------------------------------------------
    // 3. FREE: CRM Filter Toolbar (Navigation)
    // ------------------------------------------------------------------------
    const crmFilterToolbarFiles = [
      {
        path: 'CRMFilterToolbar.tsx',
        content: `import React from 'react';
import './CRMFilterToolbar.css';

export interface CRMFilterToolbarProps {
  sortBy?: string;
  onSortChange?: (val: string) => void;
  selectedOwner?: string;
  onOwnerChange?: (val: string) => void;
  selectedStage?: string;
  onStageChange?: (val: string) => void;
  selectedPeriod?: string;
  onPeriodChange?: (val: string) => void;
  onExport?: () => void;
  onNewCompany?: () => void;
  className?: string;
}

export const CRMFilterToolbar: React.FC<CRMFilterToolbarProps> = ({
  sortBy = 'Pipeline Value',
  onSortChange,
  selectedOwner = 'All Owners',
  onOwnerChange,
  selectedStage = 'Any',
  onStageChange,
  selectedPeriod = '90 Days',
  onPeriodChange,
  onExport,
  onNewCompany,
  className = '',
}) => {
  return (
    <div className={\`crm-filter-toolbar \${className}\`}>
      <div className="crm-filter-left">
        {/* Sort Pill */}
        <div className="crm-pill-filter">
          <span className="crm-pill-label">Sort by</span>
          <select
            value={sortBy}
            onChange={(e) => onSortChange?.(e.target.value)}
            className="crm-pill-select"
          >
            <option value="Pipeline Value">Pipeline Value</option>
            <option value="Win Probability">Win Probability</option>
            <option value="Company Name">Company Name</option>
            <option value="Last Activity">Last Activity</option>
          </select>
        </div>

        {/* Owner Pill */}
        <div className="crm-pill-filter">
          <span className="crm-pill-label">Filter</span>
          <select
            value={selectedOwner}
            onChange={(e) => onOwnerChange?.(e.target.value)}
            className="crm-pill-select"
          >
            <option value="All Owners">All Owners</option>
            <option value="Alex Santos">Alex Santos</option>
            <option value="Grace Miller">Grace Miller</option>
            <option value="Noah Lee">Noah Lee</option>
            <option value="Sarah Nguyen">Sarah Nguyen</option>
          </select>
        </div>

        {/* Stage Pill */}
        <div className="crm-pill-filter">
          <span className="crm-pill-label">Stage</span>
          <select
            value={selectedStage}
            onChange={(e) => onStageChange?.(e.target.value)}
            className="crm-pill-select"
          >
            <option value="Any">Any</option>
            <option value="Pilot">Pilot</option>
            <option value="Enterprise">Enterprise</option>
            <option value="Mid-Market">Mid-Market</option>
            <option value="Expansion">Expansion</option>
          </select>
        </div>

        {/* Period Pill */}
        <div className="crm-pill-filter">
          <span className="crm-pill-label">Last Activity</span>
          <select
            value={selectedPeriod}
            onChange={(e) => onPeriodChange?.(e.target.value)}
            className="crm-pill-select"
          >
            <option value="30 Days">30 Days</option>
            <option value="60 Days">60 Days</option>
            <option value="90 Days">90 Days</option>
            <option value="All Time">All Time</option>
          </select>
        </div>
      </div>

      <div className="crm-filter-right">
        <button type="button" className="crm-btn-export" onClick={onExport}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Export
        </button>

        <button type="button" className="crm-btn-primary" onClick={onNewCompany}>
          + New Company
        </button>
      </div>
    </div>
  );
};
`,
      },
      {
        path: 'CRMFilterToolbar.css',
        content: `.crm-filter-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding: 0.75rem 0;
  width: 100%;
}
.crm-filter-left {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.crm-filter-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.crm-pill-filter {
  display: inline-flex;
  align-items: center;
  background-color: #182026;
  border: 1px solid #263238;
  border-radius: 9999px;
  padding: 0.35rem 0.75rem;
  font-size: 0.8125rem;
  color: #A0AEC0;
  gap: 0.35rem;
  transition: border-color 0.15s ease;
}
.crm-pill-filter:hover {
  border-color: #395E4D;
}
.crm-pill-label {
  font-size: 0.75rem;
  color: #7C8DA6;
}
.crm-pill-select {
  background: transparent;
  border: none;
  color: #F9FBFF;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  outline: none;
}
.crm-btn-export {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background-color: #182026;
  border: 1px solid #263238;
  color: #F9FBFF;
  padding: 0.45rem 0.85rem;
  border-radius: 6px;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}
.crm-btn-export:hover {
  background-color: #232D34;
  border-color: #395E4D;
}
.crm-btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background-color: #00B562;
  border: none;
  color: #0B0F12;
  padding: 0.45rem 1rem;
  border-radius: 6px;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 0 12px rgba(0, 181, 98, 0.25);
  transition: all 0.15s ease;
}
.crm-btn-primary:hover {
  background-color: #009e56;
  transform: translateY(-1px);
}
`,
      },
      {
        path: 'index.ts',
        content: `export * from './CRMFilterToolbar';\n`,
      },
    ];

    const toolbarStored = await storeBundleFiles('crm-filter-toolbar', '1.0.0', crmFilterToolbarFiles);
    const toolbarSize = crmFilterToolbarFiles.reduce((acc, f) => acc + Buffer.byteLength(f.content, 'utf8'), 0);

    const compToolbar = await ComponentModel.findOneAndUpdate(
      { slug: 'crm-filter-toolbar' },
      {
        $set: {
          slug: 'crm-filter-toolbar',
          name: 'CRM Filter Toolbar',
          description: 'Multi-faceted pipeline toolbar with sort selector, account owner filter, deal stage picker, activity timeline filter, and export/create action buttons.',
          category: 'Navigation',
          version: '1.0.0',
          accessLevel: 'free',
          status: 'published',
          props: {
            sortBy: { name: 'sortBy', type: 'string', description: 'Currently active sort criterion', required: false, defaultValue: "'Pipeline Value'" },
            selectedOwner: { name: 'selectedOwner', type: 'string', description: 'Selected account representative filter', required: false, defaultValue: "'All Owners'" },
            selectedStage: { name: 'selectedStage', type: 'string', description: 'Deal pipeline stage filter', required: false, defaultValue: "'Any'" },
            selectedPeriod: { name: 'selectedPeriod', type: 'string', description: 'Activity timeframe duration', required: false, defaultValue: "'90 Days'" },
          },
          dependencies: ['react'],
          bundle: {
            version: '1.0.0',
            entryPoint: 'CRMFilterToolbar.tsx',
            totalSize: toolbarSize,
            fileCount: crmFilterToolbarFiles.length,
            files: toolbarStored,
            uploadedAt: new Date(),
          },
        },
      },
      { upsert: true, returnDocument: 'after' }
    );

    await ComponentBundleModel.findOneAndUpdate(
      { slug: 'crm-filter-toolbar', version: '1.0.0' },
      {
        $set: {
          componentId: compToolbar._id,
          slug: 'crm-filter-toolbar',
          version: '1.0.0',
          entryPoint: 'CRMFilterToolbar.tsx',
          totalSize: toolbarSize,
          fileCount: crmFilterToolbarFiles.length,
          files: toolbarStored,
          meta: { slug: 'crm-filter-toolbar', version: '1.0.0', accessLevel: 'free', status: 'published' },
        },
      },
      { upsert: true }
    );
    console.log('✓ Seeded component: crm-filter-toolbar (free)');

    // ------------------------------------------------------------------------
    // 4. FREE: Probability Range Slider (Forms)
    // ------------------------------------------------------------------------
    const rangeSliderFiles = [
      {
        path: 'ProbabilityRangeSlider.tsx',
        content: `import React from 'react';
import './ProbabilityRangeSlider.css';

export interface ProbabilityRangeSliderProps {
  value: number; // 0 to 100
  onChange?: (val: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export const ProbabilityRangeSlider: React.FC<ProbabilityRangeSliderProps> = ({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label = 'Win probability',
  disabled = false,
  className = '',
}) => {
  const segments = 24;
  const activeSegments = Math.round((value / max) * segments);

  const getSegmentColor = (idx: number) => {
    if (idx >= activeSegments) return '#232D34';
    const ratio = (idx + 1) / segments;
    if (ratio <= 0.33) return '#EF4444';
    if (ratio <= 0.66) return '#F59E0B';
    return '#00B562';
  };

  return (
    <div className={\`crm-slider-container \${disabled ? 'crm-slider-disabled' : ''} \${className}\`}>
      <div className="crm-slider-header">
        <label className="crm-slider-label">{label}</label>
        <span className="crm-slider-val">{value}%</span>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange?.(Number(e.target.value))}
        className="crm-range-input"
      />

      <div className="crm-slider-meter">
        {Array.from({ length: segments }).map((_, i) => (
          <span
            key={i}
            className="crm-meter-slice"
            style={{ backgroundColor: getSegmentColor(i) }}
          />
        ))}
      </div>
    </div>
  );
};
`,
      },
      {
        path: 'ProbabilityRangeSlider.css',
        content: `.crm-slider-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
}
.crm-slider-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.crm-slider-label {
  font-size: 0.8125rem;
  font-weight: 500;
  color: #A0AEC0;
}
.crm-slider-val {
  font-size: 0.875rem;
  font-weight: 700;
  color: #F9FBFF;
}
.crm-range-input {
  width: 100%;
  accent-color: #00B562;
  cursor: pointer;
}
.crm-slider-meter {
  display: flex;
  gap: 2px;
  width: 100%;
  height: 6px;
  margin-top: 0.25rem;
}
.crm-meter-slice {
  flex: 1;
  border-radius: 1px;
  transition: background-color 0.15s ease;
}
.crm-slider-disabled {
  opacity: 0.5;
  pointer-events: none;
}
`,
      },
      {
        path: 'index.ts',
        content: `export * from './ProbabilityRangeSlider';\n`,
      },
    ];

    const sliderStored = await storeBundleFiles('probability-range-slider', '1.0.0', rangeSliderFiles);
    const sliderSize = rangeSliderFiles.reduce((acc, f) => acc + Buffer.byteLength(f.content, 'utf8'), 0);

    const compSlider = await ComponentModel.findOneAndUpdate(
      { slug: 'probability-range-slider' },
      {
        $set: {
          slug: 'probability-range-slider',
          name: 'Probability Range Slider',
          description: 'Precision numeric range slider paired with real-time multi-color segmented meter feedback and formatted percentage readout.',
          category: 'Forms',
          version: '1.0.0',
          accessLevel: 'free',
          status: 'published',
          props: {
            value: { name: 'value', type: 'number', description: 'Selected value from min to max', required: true, defaultValue: 50 },
            min: { name: 'min', type: 'number', description: 'Minimum slider limit', required: false, defaultValue: 0 },
            max: { name: 'max', type: 'number', description: 'Maximum slider limit', required: false, defaultValue: 100 },
            step: { name: 'step', type: 'number', description: 'Input granularity step', required: false, defaultValue: 1 },
            label: { name: 'label', type: 'string', description: 'Header field label text', required: false, defaultValue: "'Win probability'" },
            disabled: { name: 'disabled', type: 'boolean', description: 'Disables slider interaction', required: false, defaultValue: false },
          },
          dependencies: ['react'],
          bundle: {
            version: '1.0.0',
            entryPoint: 'ProbabilityRangeSlider.tsx',
            totalSize: sliderSize,
            fileCount: rangeSliderFiles.length,
            files: sliderStored,
            uploadedAt: new Date(),
          },
        },
      },
      { upsert: true, returnDocument: 'after' }
    );

    await ComponentBundleModel.findOneAndUpdate(
      { slug: 'probability-range-slider', version: '1.0.0' },
      {
        $set: {
          componentId: compSlider._id,
          slug: 'probability-range-slider',
          version: '1.0.0',
          entryPoint: 'ProbabilityRangeSlider.tsx',
          totalSize: sliderSize,
          fileCount: rangeSliderFiles.length,
          files: sliderStored,
          meta: { slug: 'probability-range-slider', version: '1.0.0', accessLevel: 'free', status: 'published' },
        },
      },
      { upsert: true }
    );
    console.log('✓ Seeded component: probability-range-slider (free)');

    // ------------------------------------------------------------------------
    // 5. PREMIUM: CRM Detail Drawer (Overlays)
    // ------------------------------------------------------------------------
    const detailDrawerFiles = [
      {
        path: 'CRMDetailDrawer.tsx',
        content: `import React from 'react';
import './CRMDetailDrawer.css';

export interface StageHealth {
  name: string;
  probability: number;
}

export interface CRMDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  companyName?: string;
  stageBadge?: string;
  ownerName?: string;
  ownerEmail?: string;
  ownerPhone?: string;
  overallHealth?: number;
  stages?: StageHealth[];
  activityCount?: number;
  onSave?: () => void;
}

export const CRMDetailDrawer: React.FC<CRMDetailDrawerProps> = ({
  isOpen,
  onClose,
  companyName = 'Apple',
  stageBadge = 'Pilot',
  ownerName = 'Alex Santos',
  ownerEmail = 'alex.santos@crm.com',
  ownerPhone = '+1 (202) 203-5668',
  overallHealth = 82,
  stages = [
    { name: 'Discovery', probability: 31 },
    { name: 'Evaluation', probability: 53 },
    { name: 'Procurement', probability: 31 },
  ],
  activityCount = 90,
  onSave,
}) => {
  if (!isOpen) return null;

  return (
    <div className="crm-drawer-backdrop" onClick={onClose}>
      <aside className="crm-drawer-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="crm-drawer-header">
          <div className="crm-drawer-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            </svg>
            <span>Companies Detail</span>
          </div>
          <button type="button" className="crm-drawer-close" onClick={onClose} aria-label="Close drawer">
            ✕
          </button>
        </div>

        <div className="crm-drawer-body">
          {/* Company Profile Hero */}
          <div className="crm-drawer-hero">
            <div className="crm-drawer-logo">
              <span style={{ fontSize: '1.5rem' }}></span>
            </div>
            <div>
              <h2 className="crm-drawer-company">{companyName}</h2>
              <span className="crm-badge-stage">{stageBadge}</span>
            </div>
          </div>

          {/* Account Summary */}
          <div className="crm-drawer-section">
            <div className="crm-section-eyebrow">ACCOUNT SUMMARY</div>
            <div className="crm-account-owner-card">
              <div className="crm-owner-avatar">👤</div>
              <span className="crm-owner-name">{ownerName}</span>
              <span className="crm-owner-meta">✉ {ownerEmail}</span>
              <span className="crm-owner-meta">📞 {ownerPhone}</span>
            </div>
          </div>

          {/* Pipeline Health */}
          <div className="crm-drawer-section">
            <div className="crm-section-eyebrow">PIPELINE HEALTH</div>
            <div className="crm-health-stat">{overallHealth}%</div>
            <div className="crm-health-sub">Win probability across all open deals</div>

            <div className="crm-stages-list">
              {stages.map((st) => (
                <div key={st.name} className="crm-stage-row">
                  <div className="crm-stage-info">
                    <span>{st.name}</span>
                    <span className="crm-stage-pct">{st.probability}%</span>
                  </div>
                  <div className="crm-stage-track">
                    <div
                      className="crm-stage-bar"
                      style={{
                        width: \`\${st.probability}%\`,
                        backgroundColor: st.probability > 50 ? '#00B562' : '#F59E0B',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Trend */}
          <div className="crm-drawer-section">
            <div className="crm-section-eyebrow">ACTIVITY TREND</div>
            <div className="crm-trend-box">
              <span className="crm-trend-val">{activityCount}</span>
              <span className="crm-trend-desc">Spikes around QBR prep and renewal review</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="crm-drawer-footer">
          <a href="#help" className="crm-drawer-link">Need help? Ask us.</a>
          <div className="crm-drawer-actions">
            <button type="button" className="crm-btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="crm-btn-save" onClick={onSave || onClose}>
              Save Update
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
};
`,
      },
      {
        path: 'CRMDetailDrawer.css',
        content: `.crm-drawer-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(11, 15, 18, 0.65);
  backdrop-filter: blur(8px);
  z-index: 100;
  display: flex;
  justify-content: flex-end;
}
.crm-drawer-panel {
  width: 100%;
  max-width: 480px;
  background-color: #12171B;
  border-left: 1px solid #263238;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-shadow: -8px 0 24px rgba(0, 0, 0, 0.5);
}
.crm-drawer-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #232323;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.crm-drawer-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #F9FBFF;
}
.crm-drawer-close {
  background: none;
  border: none;
  color: #7C8DA6;
  font-size: 1.125rem;
  cursor: pointer;
}
.crm-drawer-body {
  padding: 1.5rem;
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.crm-drawer-hero {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.crm-drawer-logo {
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 10px;
  background-color: #182026;
  border: 1px solid #263238;
  display: flex;
  align-items: center;
  justify-content: center;
}
.crm-drawer-company {
  margin: 0 0 0.25rem;
  color: #F9FBFF;
  font-size: 1.35rem;
  font-weight: 700;
}
.crm-badge-stage {
  font-size: 0.75rem;
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
  background-color: rgba(245, 158, 11, 0.15);
  color: #F59E0B;
  border: 1px solid rgba(245, 158, 11, 0.3);
}
.crm-section-eyebrow {
  font-size: 0.75rem;
  font-weight: 600;
  color: #7C8DA6;
  margin-bottom: 0.75rem;
  letter-spacing: 0.05em;
}
.crm-account-owner-card {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding: 0.85rem;
  background-color: #182026;
  border-radius: 8px;
  border: 1px solid #232323;
  font-size: 0.8125rem;
}
.crm-owner-name { font-weight: 600; color: #F9FBFF; }
.crm-owner-meta { color: #A0AEC0; font-size: 0.75rem; }
.crm-health-stat {
  font-size: 2.25rem;
  font-weight: 800;
  color: #F9FBFF;
  line-height: 1;
  margin-bottom: 0.25rem;
}
.crm-health-sub {
  font-size: 0.8125rem;
  color: #A0AEC0;
  margin-bottom: 1rem;
}
.crm-stages-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.crm-stage-info {
  display: flex;
  justify-content: space-between;
  font-size: 0.8125rem;
  color: #F9FBFF;
  margin-bottom: 0.35rem;
}
.crm-stage-track {
  width: 100%;
  height: 6px;
  background-color: #182026;
  border-radius: 9999px;
  overflow: hidden;
}
.crm-stage-bar {
  height: 100%;
  border-radius: 9999px;
}
.crm-drawer-footer {
  padding: 1.25rem 1.5rem;
  border-top: 1px solid #232323;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.crm-drawer-link {
  color: #00B562;
  font-size: 0.8125rem;
  text-decoration: underline;
}
.crm-drawer-actions {
  display: flex;
  gap: 0.5rem;
}
.crm-btn-cancel {
  background: transparent;
  border: 1px solid #263238;
  color: #A0AEC0;
  padding: 0.45rem 0.85rem;
  border-radius: 6px;
  cursor: pointer;
}
.crm-btn-save {
  background-color: #00B562;
  border: none;
  color: #0B0F12;
  font-weight: 600;
  padding: 0.45rem 1rem;
  border-radius: 6px;
  cursor: pointer;
}
`,
      },
      {
        path: 'index.ts',
        content: `export * from './CRMDetailDrawer';\n`,
      },
    ];

    const drawerStored = await storeBundleFiles('crm-detail-drawer', '1.0.0', detailDrawerFiles);
    const drawerSize = detailDrawerFiles.reduce((acc, f) => acc + Buffer.byteLength(f.content, 'utf8'), 0);

    const compDrawer = await ComponentModel.findOneAndUpdate(
      { slug: 'crm-detail-drawer' },
      {
        $set: {
          slug: 'crm-detail-drawer',
          name: 'CRM Entity Detail Drawer',
          description: 'Slide-over detail drawer displaying account overview, contact channels, multi-stage pipeline health meters, and historical activity cadence.',
          category: 'Overlays',
          version: '1.0.0',
          accessLevel: 'premium',
          status: 'published',
          props: {
            isOpen: { name: 'isOpen', type: 'boolean', description: 'Drawer visibility state', required: true, defaultValue: true },
            companyName: { name: 'companyName', type: 'string', description: 'Primary entity title', required: false, defaultValue: "'Apple'" },
            stageBadge: { name: 'stageBadge', type: 'string', description: 'Pipeline stage pill indicator', required: false, defaultValue: "'Pilot'" },
            ownerName: { name: 'ownerName', type: 'string', description: 'Assigned account executive', required: false, defaultValue: "'Alex Santos'" },
            overallHealth: { name: 'overallHealth', type: 'number', description: 'Aggregate deal win percentage', required: false, defaultValue: 82 },
          },
          dependencies: ['react'],
          bundle: {
            version: '1.0.0',
            entryPoint: 'CRMDetailDrawer.tsx',
            totalSize: drawerSize,
            fileCount: detailDrawerFiles.length,
            files: drawerStored,
            uploadedAt: new Date(),
          },
        },
      },
      { upsert: true, returnDocument: 'after' }
    );

    await ComponentBundleModel.findOneAndUpdate(
      { slug: 'crm-detail-drawer', version: '1.0.0' },
      {
        $set: {
          componentId: compDrawer._id,
          slug: 'crm-detail-drawer',
          version: '1.0.0',
          entryPoint: 'CRMDetailDrawer.tsx',
          totalSize: drawerSize,
          fileCount: detailDrawerFiles.length,
          files: drawerStored,
          meta: { slug: 'crm-detail-drawer', version: '1.0.0', accessLevel: 'premium', status: 'published' },
        },
      },
      { upsert: true }
    );
    console.log('✓ Seeded component: crm-detail-drawer (premium)');

    // ------------------------------------------------------------------------
    // 6. PREMIUM: CRM Activity & Notifications Feed (Feedback)
    // ------------------------------------------------------------------------
    const activityFeedFiles = [
      {
        path: 'CRMActivityFeed.tsx',
        content: `import React, { useState } from 'react';
import './CRMActivityFeed.css';

export interface ActivityNotificationItem {
  id: string;
  authorName: string;
  actionText: string;
  comment?: string;
  targetCompany: string;
  timestamp: string;
  unread: boolean;
  avatarIcon?: string;
}

export interface CRMActivityFeedProps {
  notifications?: ActivityNotificationItem[];
  unreadCount?: number;
  onMarkAllAsRead?: () => void;
  onItemClick?: (item: ActivityNotificationItem) => void;
  className?: string;
}

export const CRMActivityFeed: React.FC<CRMActivityFeedProps> = ({
  notifications = [
    {
      id: '1',
      authorName: 'Mark Darnalds',
      actionText: 'mentioned you on Microsoft',
      comment: 'Can you join the pilot review on Friday? Procurement wants a security walkthrough.',
      targetCompany: 'Microsoft',
      timestamp: '2m ago',
      unread: true,
      avatarIcon: '👨‍💼',
    },
    {
      id: '2',
      authorName: 'Sarah Nguyen',
      actionText: 'moved LVMH to Renewal',
      targetCompany: 'LVMH',
      timestamp: '18m ago',
      unread: true,
      avatarIcon: '👩‍💼',
    },
    {
      id: '3',
      authorName: 'System Alert',
      actionText: 'Win probability for Slack dropped to 23%',
      targetCompany: 'Slack',
      timestamp: '1h ago',
      unread: true,
      avatarIcon: '⚡',
    },
    {
      id: '4',
      authorName: 'Noah Lee',
      actionText: 'logged a demo with Stripe',
      targetCompany: 'Stripe',
      timestamp: 'Yesterday',
      unread: false,
      avatarIcon: '💼',
    },
  ],
  unreadCount = 3,
  onMarkAllAsRead,
  onItemClick,
  className = '',
}) => {
  const [tab, setTab] = useState<'all' | 'unread'>('all');

  const filtered = tab === 'unread' ? notifications.filter((n) => n.unread) : notifications;

  return (
    <div className={\`crm-activity-feed \${className}\`}>
      {/* Header */}
      <div className="crm-feed-header">
        <div className="crm-feed-title-wrap">
          <span className="crm-feed-title">Notifications</span>
          {unreadCount > 0 && <span className="crm-unread-badge">{unreadCount}</span>}
        </div>
        <button type="button" className="crm-mark-read-btn" onClick={onMarkAllAsRead}>
          Mark all as read
        </button>
      </div>

      {/* Tabs */}
      <div className="crm-feed-tabs">
        <button
          type="button"
          className={\`crm-feed-tab \${tab === 'all' ? 'active' : ''}\`}
          onClick={() => setTab('all')}
        >
          All
        </button>
        <button
          type="button"
          className={\`crm-feed-tab \${tab === 'unread' ? 'active' : ''}\`}
          onClick={() => setTab('unread')}
        >
          Unread
        </button>
      </div>

      {/* Notification List */}
      <div className="crm-feed-list">
        {filtered.map((item) => (
          <div
            key={item.id}
            className={\`crm-feed-item \${item.unread ? 'unread' : ''}\`}
            onClick={() => onItemClick?.(item)}
          >
            <div className="crm-feed-avatar">{item.avatarIcon || '👤'}</div>

            <div className="crm-feed-content">
              <div className="crm-feed-action-line">
                <strong>{item.authorName}</strong> {item.actionText}
                {item.unread && <span className="crm-red-dot" />}
              </div>

              {item.comment && (
                <div className="crm-feed-bubble">{item.comment}</div>
              )}

              <div className="crm-feed-meta">
                <span>{item.timestamp}</span>
                <span>•</span>
                <span>{item.targetCompany}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
`,
      },
      {
        path: 'CRMActivityFeed.css',
        content: `.crm-activity-feed {
  width: 100%;
  max-width: 380px;
  background-color: #12171B;
  border: 1px solid #263238;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  font-family: inherit;
}
.crm-feed-header {
  padding: 1rem 1.25rem 0.75rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.crm-feed-title-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.crm-feed-title {
  font-weight: 700;
  font-size: 1rem;
  color: #F9FBFF;
}
.crm-unread-badge {
  background-color: rgba(239, 68, 68, 0.2);
  color: #EF4444;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.1rem 0.45rem;
  border-radius: 9999px;
}
.crm-mark-read-btn {
  background: none;
  border: none;
  color: #7C8DA6;
  font-size: 0.75rem;
  cursor: pointer;
}
.crm-mark-read-btn:hover { color: #00B562; }
.crm-feed-tabs {
  display: flex;
  border-bottom: 1px solid #232323;
  padding: 0 1.25rem;
  gap: 1rem;
}
.crm-feed-tab {
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: #7C8DA6;
  font-size: 0.8125rem;
  font-weight: 500;
  padding: 0.5rem 0;
  cursor: pointer;
}
.crm-feed-tab.active {
  color: #F9FBFF;
  border-bottom-color: #00B562;
  font-weight: 600;
}
.crm-feed-list {
  max-height: 380px;
  overflow-y: auto;
  padding: 0.5rem 0;
}
.crm-feed-item {
  display: flex;
  gap: 0.75rem;
  padding: 0.75rem 1.25rem;
  cursor: pointer;
  transition: background-color 0.15s ease;
}
.crm-feed-item:hover {
  background-color: rgba(24, 32, 38, 0.6);
}
.crm-feed-avatar {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background-color: #182026;
  border: 1px solid #263238;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.crm-feed-content { flex: 1; }
.crm-feed-action-line {
  font-size: 0.8125rem;
  color: #F9FBFF;
  line-height: 1.4;
  position: relative;
  padding-right: 0.75rem;
}
.crm-red-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  background-color: #EF4444;
  border-radius: 50%;
  margin-left: 0.4rem;
}
.crm-feed-bubble {
  margin-top: 0.35rem;
  padding: 0.5rem 0.75rem;
  background-color: #182026;
  border: 1px solid #263238;
  border-radius: 8px;
  font-size: 0.75rem;
  color: #A0AEC0;
  line-height: 1.4;
}
.crm-feed-meta {
  display: flex;
  gap: 0.4rem;
  font-size: 0.7rem;
  color: #7C8DA6;
  margin-top: 0.35rem;
}
`,
      },
      {
        path: 'index.ts',
        content: `export * from './CRMActivityFeed';\n`,
      },
    ];

    const feedStored = await storeBundleFiles('crm-activity-feed', '1.0.0', activityFeedFiles);
    const feedSize = activityFeedFiles.reduce((acc, f) => acc + Buffer.byteLength(f.content, 'utf8'), 0);

    const compFeed = await ComponentModel.findOneAndUpdate(
      { slug: 'crm-activity-feed' },
      {
        $set: {
          slug: 'crm-activity-feed',
          name: 'CRM Activity & Notifications Popover',
          description: 'Floating notification popover with tabbed filtering (All / Unread), deal stage movements, team mentions, and inline comment bubbles.',
          category: 'Feedback',
          version: '1.0.0',
          accessLevel: 'premium',
          status: 'published',
          props: {
            unreadCount: { name: 'unreadCount', type: 'number', description: 'Pending unread notifications count', required: false, defaultValue: 3 },
            notifications: { name: 'notifications', type: 'ActivityNotificationItem[]', description: 'Notification events stream list', required: false },
          },
          dependencies: ['react'],
          bundle: {
            version: '1.0.0',
            entryPoint: 'CRMActivityFeed.tsx',
            totalSize: feedSize,
            fileCount: activityFeedFiles.length,
            files: feedStored,
            uploadedAt: new Date(),
          },
        },
      },
      { upsert: true, returnDocument: 'after' }
    );

    await ComponentBundleModel.findOneAndUpdate(
      { slug: 'crm-activity-feed', version: '1.0.0' },
      {
        $set: {
          componentId: compFeed._id,
          slug: 'crm-activity-feed',
          version: '1.0.0',
          entryPoint: 'CRMActivityFeed.tsx',
          totalSize: feedSize,
          fileCount: activityFeedFiles.length,
          files: feedStored,
          meta: { slug: 'crm-activity-feed', version: '1.0.0', accessLevel: 'premium', status: 'published' },
        },
      },
      { upsert: true }
    );
    console.log('✓ Seeded component: crm-activity-feed (premium)');

    // ------------------------------------------------------------------------
    // 7. PREMIUM: Sales Pipeline Table (Data Display)
    // ------------------------------------------------------------------------
    const pipelineTableFiles = [
      {
        path: 'CRMPipelineTable.tsx',
        content: `import React, { useState } from 'react';
import './CRMPipelineTable.css';

export interface CompanyPipelineRow {
  id: string;
  name: string;
  tags: string[];
  owner: { name: string; avatar: string };
  openDeals: number;
  pipelineValue: string;
  winProbability: number;
  activityCadence: number[];
  lastInteraction: { date: string; tag: string };
}

export interface CRMPipelineTableProps {
  rows?: CompanyPipelineRow[];
  selectedIds?: string[];
  onSelectRow?: (id: string) => void;
  onRowClick?: (row: CompanyPipelineRow) => void;
  className?: string;
}

export const CRMPipelineTable: React.FC<CRMPipelineTableProps> = ({
  rows = [
    {
      id: 'c1',
      name: 'Apple',
      tags: ['Pilot'],
      owner: { name: 'Alex Santos', avatar: '👨‍💼' },
      openDeals: 6,
      pipelineValue: '$ 530,111',
      winProbability: 82,
      activityCadence: [4, 7, 3, 9, 6, 12, 8, 14],
      lastInteraction: { date: 'Mar 12', tag: 'Exec' },
    },
    {
      id: 'c2',
      name: 'Snowflake',
      tags: ['Enterprise', 'Mid-Market'],
      owner: { name: 'Grace Miller', avatar: '👩‍💼' },
      openDeals: 6,
      pipelineValue: '$ 520,000',
      winProbability: 24,
      activityCadence: [2, 5, 4, 3, 8, 6, 9, 7],
      lastInteraction: { date: 'Sept 11', tag: 'Pricing' },
    },
    {
      id: 'c3',
      name: 'Stripe',
      tags: ['Expansion', 'SMB'],
      owner: { name: 'Noah Lee', avatar: '👨‍💻' },
      openDeals: 3,
      pipelineValue: '$ 442,231',
      winProbability: 44,
      activityCadence: [5, 8, 6, 10, 9, 12, 11, 14],
      lastInteraction: { date: 'Sept 9', tag: 'Demo' },
    },
    {
      id: 'c4',
      name: 'Microsoft',
      tags: ['Strategic', 'Expansion'],
      owner: { name: 'Mark Darnalds', avatar: '👨‍💼' },
      openDeals: 8,
      pipelineValue: '$ 320,222',
      winProbability: 86,
      activityCadence: [6, 9, 8, 12, 11, 15, 12, 16],
      lastInteraction: { date: 'Mar 15', tag: 'Pilot' },
    },
  ],
  selectedIds = ['c4'],
  onSelectRow,
  onRowClick,
  className = '',
}) => {
  const [internalSelected, setInternalSelected] = useState<string[]>(selectedIds);

  const toggleRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = internalSelected.includes(id)
      ? internalSelected.filter((i) => i !== id)
      : [...internalSelected, id];
    setInternalSelected(updated);
    onSelectRow?.(id);
  };

  return (
    <div className={\`crm-table-container \${className}\`}>
      <table className="crm-pipeline-table">
        <thead>
          <tr>
            <th style={{ width: '40px' }}>
              <input type="checkbox" className="crm-checkbox" readOnly checked={internalSelected.length === rows.length} />
            </th>
            <th>Companies</th>
            <th>Segment & Stage</th>
            <th>Account Owner</th>
            <th>Open Deals</th>
            <th>Pipeline Value</th>
            <th>Win Probability</th>
            <th>Activity Trend</th>
            <th>Last Interaction</th>
            <th style={{ width: '32px' }}></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isSelected = internalSelected.includes(row.id);
            return (
              <tr
                key={row.id}
                className={\`crm-table-row \${isSelected ? 'selected' : ''}\`}
                onClick={() => onRowClick?.(row)}
              >
                <td onClick={(e) => toggleRow(row.id, e)}>
                  <input type="checkbox" className="crm-checkbox" checked={isSelected} readOnly />
                </td>
                <td className="crm-col-company">
                  <span className="crm-company-name">{row.name}</span>
                </td>
                <td>
                  <div className="crm-tags-wrap">
                    {row.tags.map((t) => (
                      <span key={t} className="crm-tag-pill">{t}</span>
                    ))}
                  </div>
                </td>
                <td>
                  <div className="crm-owner-chip">
                    <span className="crm-owner-avatar-icon">{row.owner.avatar}</span>
                    <span>{row.owner.name}</span>
                  </div>
                </td>
                <td className="crm-col-num">{row.openDeals}</td>
                <td className="crm-col-val">{row.pipelineValue}</td>
                <td>
                  <div className="crm-prob-cell">
                    <div className="crm-mini-meter">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <span
                          key={i}
                          style={{
                            backgroundColor:
                              i < Math.round((row.winProbability / 100) * 8)
                                ? row.winProbability > 50
                                  ? '#00B562'
                                  : '#F59E0B'
                                : '#232D34',
                          }}
                        />
                      ))}
                    </div>
                    <span>{row.winProbability}%</span>
                  </div>
                </td>
                <td>
                  <div className="crm-sparkline-cell">
                    {row.activityCadence.map((val, idx) => (
                      <span key={idx} style={{ height: \`\${Math.max(3, val)}px\` }} />
                    ))}
                  </div>
                </td>
                <td>
                  <div className="crm-last-int">
                    <span>📅 {row.lastInteraction.date}</span>
                    <span className="crm-int-tag">{row.lastInteraction.tag}</span>
                  </div>
                </td>
                <td>
                  <button type="button" className="crm-row-dots" onClick={(e) => e.stopPropagation()}>···</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Aggregate Calculations Footer */}
      <div className="crm-table-footer">
        <span className="crm-footer-count">{rows.length} Companies in view</span>
        <span className="crm-footer-calc">+ Sum of pipeline</span>
        <span className="crm-footer-calc">+ Avg win probability</span>
        <span className="crm-footer-calc">+ Add Calculation</span>
      </div>
    </div>
  );
};
`,
      },
      {
        path: 'CRMPipelineTable.css',
        content: `.crm-table-container {
  width: 100%;
  background-color: #12171B;
  border: 1px solid #263238;
  border-radius: 8px;
  overflow-x: auto;
  font-family: inherit;
}
.crm-pipeline-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.8125rem;
}
.crm-pipeline-table th {
  padding: 0.75rem 1rem;
  color: #7C8DA6;
  font-weight: 500;
  font-size: 0.75rem;
  border-bottom: 1px solid #232323;
  white-space: nowrap;
}
.crm-pipeline-table td {
  padding: 0.85rem 1rem;
  border-bottom: 1px solid #1E272E;
  color: #A0AEC0;
  white-space: nowrap;
}
.crm-table-row {
  cursor: pointer;
  transition: background-color 0.15s ease;
}
.crm-table-row:hover {
  background-color: rgba(24, 32, 38, 0.7);
}
.crm-table-row.selected {
  background-color: rgba(0, 181, 98, 0.08);
}
.crm-checkbox {
  accent-color: #00B562;
  cursor: pointer;
}
.crm-company-name {
  font-weight: 600;
  color: #F9FBFF;
}
.crm-tags-wrap {
  display: flex;
  gap: 0.35rem;
}
.crm-tag-pill {
  padding: 0.15rem 0.5rem;
  background-color: #182026;
  border: 1px solid #263238;
  border-radius: 9999px;
  font-size: 0.7rem;
  color: #F9FBFF;
}
.crm-owner-chip {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: #F9FBFF;
}
.crm-col-num {
  text-align: center;
  font-weight: 500;
  color: #F9FBFF;
}
.crm-col-val {
  font-weight: 600;
  color: #F9FBFF;
  font-family: monospace;
}
.crm-prob-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #F9FBFF;
}
.crm-mini-meter {
  display: flex;
  gap: 1.5px;
}
.crm-mini-meter span {
  width: 2.5px;
  height: 12px;
  border-radius: 1px;
}
.crm-sparkline-cell {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 16px;
}
.crm-sparkline-cell span {
  width: 3px;
  background-color: #00B562;
  border-radius: 1px;
}
.crm-last-int {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}
.crm-int-tag {
  font-size: 0.7rem;
  color: #7C8DA6;
}
.crm-row-dots {
  background: none;
  border: none;
  color: #7C8DA6;
  cursor: pointer;
}
.crm-table-footer {
  padding: 0.75rem 1rem;
  background-color: #0E1316;
  display: flex;
  gap: 1.5rem;
  font-size: 0.75rem;
  color: #7C8DA6;
}
.crm-footer-calc {
  cursor: pointer;
}
.crm-footer-calc:hover { color: #00B562; }
`,
      },
      {
        path: 'index.ts',
        content: `export * from './CRMPipelineTable';\n`,
      },
    ];

    const tableStored = await storeBundleFiles('crm-pipeline-table', '1.0.0', pipelineTableFiles);
    const tableSize = pipelineTableFiles.reduce((acc, f) => acc + Buffer.byteLength(f.content, 'utf8'), 0);

    const compTable = await ComponentModel.findOneAndUpdate(
      { slug: 'crm-pipeline-table' },
      {
        $set: {
          slug: 'crm-pipeline-table',
          name: 'Sales Pipeline Table',
          description: 'Complete sales pipeline table featuring deal stage badges, account owner avatars, win probability meters, cadence sparklines, and aggregate calculation footer.',
          category: 'Data Display',
          version: '1.0.0',
          accessLevel: 'premium',
          status: 'published',
          props: {
            rows: { name: 'rows', type: 'CompanyPipelineRow[]', description: 'Table pipeline row datasets', required: false },
            selectedIds: { name: 'selectedIds', type: 'string[]', description: 'Array of currently selected company IDs', required: false },
          },
          dependencies: ['react'],
          bundle: {
            version: '1.0.0',
            entryPoint: 'CRMPipelineTable.tsx',
            totalSize: tableSize,
            fileCount: pipelineTableFiles.length,
            files: tableStored,
            uploadedAt: new Date(),
          },
        },
      },
      { upsert: true, returnDocument: 'after' }
    );

    await ComponentBundleModel.findOneAndUpdate(
      { slug: 'crm-pipeline-table', version: '1.0.0' },
      {
        $set: {
          componentId: compTable._id,
          slug: 'crm-pipeline-table',
          version: '1.0.0',
          entryPoint: 'CRMPipelineTable.tsx',
          totalSize: tableSize,
          fileCount: pipelineTableFiles.length,
          files: tableStored,
          meta: { slug: 'crm-pipeline-table', version: '1.0.0', accessLevel: 'premium', status: 'published' },
        },
      },
      { upsert: true }
    );
    console.log('✓ Seeded component: crm-pipeline-table (premium)');

    console.log('All 7 Sales CRM components successfully seeded into MongoDB!');
  } catch (err) {
    console.error('Failed to seed Sales CRM components:', err);
    throw err;
  } finally {
    await disconnectDB();
  }
}

seedSalesCRMComponents().catch((err) => {
  console.error(err);
  process.exit(1);
});
