import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { screen } from '@testing-library/dom';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { NavLink } from '../NavLink';

describe('NavLink Component', () => {
  const renderNavLink = (currentPath: string, to: string) => {
    return render(
      <MemoryRouter initialEntries={[currentPath]}>
        <Routes>
          <Route
            path="*"
            element={
              <NavLink to={to} activeClassName="active-class" className="base-class">
                Link Text
              </NavLink>
            }
          />
        </Routes>
      </MemoryRouter>
    );
  };

  it('should render link with text', () => {
    renderNavLink('/', '/home');
    expect(screen.getByText('Link Text')).toBeInTheDocument();
  });

  it('should have correct href', () => {
    renderNavLink('/', '/home');
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/home');
  });

  it('should apply active class when route matches', () => {
    renderNavLink('/home', '/home');
    const link = screen.getByRole('link');
    expect(link).toHaveClass('active-class');
  });

  it('should not apply active class when route does not match', () => {
    renderNavLink('/other', '/home');
    const link = screen.getByRole('link');
    expect(link).not.toHaveClass('active-class');
  });

  it('should always apply base className', () => {
    renderNavLink('/', '/home');
    const link = screen.getByRole('link');
    expect(link).toHaveClass('base-class');
  });

  it('should render with children', () => {
    render(
      <MemoryRouter>
        <NavLink to="/test">
          <span data-testid="icon">Icon</span>
          <span>Label</span>
        </NavLink>
      </MemoryRouter>
    );

    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.getByText('Label')).toBeInTheDocument();
  });
});
