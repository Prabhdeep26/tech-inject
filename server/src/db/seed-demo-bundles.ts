import { connectDB, disconnectDB } from './mongoose.js';
import { ComponentModel, ComponentBundleModel, UserModel } from '../models/index.js';
import { storeBundleFiles } from '../storage/gridfs.js';

export async function seedDemoBundles() {
  console.log('Connecting to MongoDB...');
  await connectDB();

  try {
    // 1. Ensure Premium User exists
    let premiumUser = await UserModel.findOne({ email: 'premium.developer@tech-inject.dev' });
    if (!premiumUser) {
      premiumUser = await UserModel.create({
        email: 'premium.developer@tech-inject.dev',
        password: 'Password123!',
        isPremium: true,
        isAdmin: false,
      });
      console.log('Created premium user: premium.developer@tech-inject.dev');
    } else {
      premiumUser.isPremium = true;
      await premiumUser.save();
      console.log('Updated existing user to premium: premium.developer@tech-inject.dev');
    }

    // 2. Seed Free Component: action-button
    const actionButtonFiles = [
      {
        path: 'ActionButton.tsx',
        content: `import React from 'react';
import './ActionButton.css';

export interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}) => {
  return (
    <button
      className={\`ti-action-button ti-btn-\${variant} ti-btn-\${size} \${className}\`}
      {...props}
    >
      {children}
    </button>
  );
};
`,
      },
      {
        path: 'ActionButton.css',
        content: `.ti-action-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: inherit;
  font-weight: 600;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  border: 1px solid transparent;
}
.ti-btn-sm { padding: 6px 12px; font-size: 0.8125rem; }
.ti-btn-md { padding: 8px 16px; font-size: 0.875rem; }
.ti-btn-lg { padding: 12px 24px; font-size: 1rem; }
.ti-btn-primary { background-color: #00B562; color: #ffffff; }
.ti-btn-primary:hover { background-color: #009953; }
.ti-btn-secondary { background-color: #222C34; color: #ffffff; border-color: #2D3A44; }
.ti-btn-secondary:hover { background-color: #2A3640; }
.ti-btn-outline { background-color: transparent; color: #00B562; border-color: #00B562; }
.ti-btn-outline:hover { background-color: rgba(0, 181, 98, 0.1); }
`,
      },
    ];

    const freeStoredFiles = await storeBundleFiles('action-button', '1.0.0', actionButtonFiles);
    const freeTotalSize = actionButtonFiles.reduce((acc, f) => acc + Buffer.byteLength(f.content, 'utf8'), 0);

    const freeComp = await ComponentModel.findOneAndUpdate(
      { slug: 'action-button' },
      {
        $set: {
          slug: 'action-button',
          name: 'Action Button',
          description: 'High performance standalone action button with customizable variants and scale tiers.',
          category: 'Buttons',
          version: '1.0.0',
          accessLevel: 'free',
          status: 'published',
          props: {
            variant: { name: 'variant', type: "'primary' | 'secondary' | 'outline'", defaultValue: "'primary'" },
            size: { name: 'size', type: "'sm' | 'md' | 'lg'", defaultValue: "'md'" },
          },
          dependencies: ['react'],
          bundle: {
            version: '1.0.0',
            entryPoint: 'ActionButton.tsx',
            totalSize: freeTotalSize,
            fileCount: actionButtonFiles.length,
            files: freeStoredFiles,
            uploadedAt: new Date(),
          },
        },
      },
      { upsert: true, returnDocument: 'after' }
    );

    await ComponentBundleModel.findOneAndUpdate(
      { slug: 'action-button', version: '1.0.0' },
      {
        $set: {
          componentId: freeComp._id,
          slug: 'action-button',
          version: '1.0.0',
          entryPoint: 'ActionButton.tsx',
          totalSize: freeTotalSize,
          fileCount: actionButtonFiles.length,
          files: freeStoredFiles,
          meta: { slug: 'action-button', version: '1.0.0', accessLevel: 'free', status: 'published' },
        },
      },
      { upsert: true }
    );
    console.log('Seeded free component: action-button');

    // 3. Seed Premium Component: metric-card
    const metricCardFiles = [
      {
        path: 'MetricCard.tsx',
        content: `import React from 'react';
import './MetricCard.css';

export interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  description?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  isPositive = true,
  description,
}) => {
  return (
    <div className="ti-metric-card">
      <div className="ti-metric-title">{title}</div>
      <div className="ti-metric-value">{value}</div>
      <div className="ti-metric-footer">
        {change && (
          <span className={\`ti-metric-trend \${isPositive ? 'positive' : 'negative'}\`}>
            {isPositive ? '▲' : '▼'} {change}
          </span>
        )}
        {description && <span className="ti-metric-desc">{description}</span>}
      </div>
    </div>
  );
};
`,
      },
      {
        path: 'MetricCard.css',
        content: `.ti-metric-card {
  background-color: #182026;
  border: 1px solid #2D3A44;
  border-radius: 8px;
  padding: 1.25rem;
  font-family: inherit;
}
.ti-metric-title {
  font-size: 0.8125rem;
  color: #94A3B8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
  margin-bottom: 0.5rem;
}
.ti-metric-value {
  font-size: 1.875rem;
  font-weight: 700;
  color: #FFFFFF;
  margin-bottom: 0.5rem;
}
.ti-metric-footer {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
}
.ti-metric-trend.positive { color: #10B981; font-weight: 600; }
.ti-metric-trend.negative { color: #EF4444; font-weight: 600; }
.ti-metric-desc { color: #64748B; font-size: 0.75rem; }
`,
      },
    ];

    const premStoredFiles = await storeBundleFiles('metric-card', '1.0.0', metricCardFiles);
    const premTotalSize = metricCardFiles.reduce((acc, f) => acc + Buffer.byteLength(f.content, 'utf8'), 0);

    const premComp = await ComponentModel.findOneAndUpdate(
      { slug: 'metric-card' },
      {
        $set: {
          slug: 'metric-card',
          name: 'KPI Metric Stat Card',
          description: 'Enterprise dashboard KPI statistic card with positive/negative trend sparklines.',
          category: 'Cards',
          version: '1.0.0',
          accessLevel: 'premium',
          status: 'published',
          props: {
            title: { name: 'title', type: 'string', required: true },
            value: { name: 'value', type: 'string | number', required: true },
            change: { name: 'change', type: 'string' },
            isPositive: { name: 'isPositive', type: 'boolean', defaultValue: true },
          },
          dependencies: ['react'],
          bundle: {
            version: '1.0.0',
            entryPoint: 'MetricCard.tsx',
            totalSize: premTotalSize,
            fileCount: metricCardFiles.length,
            files: premStoredFiles,
            uploadedAt: new Date(),
          },
        },
      },
      { upsert: true, returnDocument: 'after' }
    );

    await ComponentBundleModel.findOneAndUpdate(
      { slug: 'metric-card', version: '1.0.0' },
      {
        $set: {
          componentId: premComp._id,
          slug: 'metric-card',
          version: '1.0.0',
          entryPoint: 'MetricCard.tsx',
          totalSize: premTotalSize,
          fileCount: metricCardFiles.length,
          files: premStoredFiles,
          meta: { slug: 'metric-card', version: '1.0.0', accessLevel: 'premium', status: 'published' },
        },
      },
      { upsert: true }
    );
    console.log('Seeded premium component: metric-card');
    console.log('All demo bundles seeded successfully!');
  } finally {
    await disconnectDB();
  }
}

// Allow direct CLI execution
seedDemoBundles()
  .then(() => {
    console.log('Seed completed successfully.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Seed error:', err);
    process.exit(1);
  });

