import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { screen } from '@testing-library/dom';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Breadcrumbs } from '../Breadcrumbs';

describe('Breadcrumbs Component', () => {
  const renderBreadcrumbs = (path: string) => {
    return render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="*" element={<Breadcrumbs />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('should not render on root path', () => {
    const { container } = renderBreadcrumbs('/');
    expect(container.querySelector('nav')).not.toBeInTheDocument();
  });

  it('should render breadcrumb for single level path', () => {
    renderBreadcrumbs('/vendas');
    
    // Check for home icon presence
    const nav = document.querySelector('nav');
    expect(nav).toBeInTheDocument();
  });

  it('should display correct route name', () => {
    renderBreadcrumbs('/produtos');
    expect(screen.getByText('Produtos')).toBeInTheDocument();
  });

  it('should display PDV for vendas route', () => {
    renderBreadcrumbs('/vendas');
    expect(screen.getByText('PDV')).toBeInTheDocument();
  });

  it('should have home link pointing to root', () => {
    renderBreadcrumbs('/vendas');
    
    const homeLink = document.querySelector('a[href="/"]');
    expect(homeLink).toBeInTheDocument();
  });
});
