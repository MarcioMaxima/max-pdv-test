import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { screen } from '@testing-library/dom';
import { StatsCard } from '../StatsCard';
import { DollarSign } from 'lucide-react';

describe('StatsCard Component', () => {
  const defaultProps = {
    title: 'Total Sales',
    value: 'R$ 1.500,00',
    icon: DollarSign,
  };

  it('should render card with title and value', () => {
    render(<StatsCard {...defaultProps} />);

    expect(screen.getByText('Total Sales')).toBeInTheDocument();
    expect(screen.getByText('R$ 1.500,00')).toBeInTheDocument();
  });

  it('should render icon', () => {
    render(<StatsCard {...defaultProps} />);
    
    const iconContainer = document.querySelector('svg');
    expect(iconContainer).toBeInTheDocument();
  });

  it('should display positive change', () => {
    render(
      <StatsCard
        {...defaultProps}
        change="+12% vs último mês"
        changeType="positive"
      />
    );
    
    expect(screen.getByText('+12% vs último mês')).toBeInTheDocument();
  });

  it('should display negative change', () => {
    render(
      <StatsCard
        {...defaultProps}
        change="-5% vs último mês"
        changeType="negative"
      />
    );
    
    expect(screen.getByText('-5% vs último mês')).toBeInTheDocument();
  });

  it('should not display change when not provided', () => {
    render(<StatsCard {...defaultProps} />);
    
    expect(screen.getByText('Total Sales')).toBeInTheDocument();
    expect(screen.getByText('R$ 1.500,00')).toBeInTheDocument();
  });

  it('should apply custom icon color', () => {
    render(
      <StatsCard
        {...defaultProps}
        iconColor="bg-success/10 text-success"
      />
    );

    const iconContainer = document.querySelector('.bg-success\\/10');
    expect(iconContainer).toBeInTheDocument();
  });
});
