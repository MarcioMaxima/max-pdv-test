import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { screen } from '@testing-library/dom';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../card';

describe('Card Component', () => {
  it('should render card with all parts', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card Description</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Card content goes here</p>
        </CardContent>
        <CardFooter>
          <p>Card footer</p>
        </CardFooter>
      </Card>
    );

    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card Description')).toBeInTheDocument();
    expect(screen.getByText('Card content goes here')).toBeInTheDocument();
    expect(screen.getByText('Card footer')).toBeInTheDocument();
  });

  it('should apply custom className to Card', () => {
    render(<Card className="custom-card" data-testid="card">Content</Card>);
    expect(screen.getByTestId('card')).toHaveClass('custom-card');
  });

  it('should render card header with proper styling', () => {
    render(
      <CardHeader data-testid="header">
        <CardTitle>Title</CardTitle>
      </CardHeader>
    );
    
    expect(screen.getByTestId('header')).toHaveClass('flex', 'flex-col', 'space-y-1.5');
  });

  it('should render card title as h3', () => {
    render(<CardTitle>My Title</CardTitle>);
    
    const title = screen.getByText('My Title');
    expect(title.tagName).toBe('H3');
  });

  it('should render only content', () => {
    render(
      <Card>
        <CardContent>Only content</CardContent>
      </Card>
    );

    expect(screen.getByText('Only content')).toBeInTheDocument();
  });

  it('should compose card parts correctly', () => {
    render(
      <Card data-testid="card">
        <CardHeader data-testid="header">
          <CardTitle data-testid="title">Title</CardTitle>
        </CardHeader>
      </Card>
    );

    const card = screen.getByTestId('card');
    const header = screen.getByTestId('header');
    const title = screen.getByTestId('title');

    expect(card).toContainElement(header);
    expect(header).toContainElement(title);
  });
});
