import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { screen, within } from '@testing-library/dom';
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from '../table';

describe('Table Component', () => {
  const renderTable = () => {
    return render(
      <Table>
        <TableCaption>A list of products</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Stock</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Product A</TableCell>
            <TableCell>R$ 50,00</TableCell>
            <TableCell>10</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Product B</TableCell>
            <TableCell>R$ 75,00</TableCell>
            <TableCell>5</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={2}>Total</TableCell>
            <TableCell>15</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    );
  };

  it('should render table with all parts', () => {
    renderTable();

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('A list of products')).toBeInTheDocument();
  });

  it('should render table headers', () => {
    renderTable();

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Price')).toBeInTheDocument();
    expect(screen.getByText('Stock')).toBeInTheDocument();
  });

  it('should render table body rows', () => {
    renderTable();

    expect(screen.getByText('Product A')).toBeInTheDocument();
    expect(screen.getByText('Product B')).toBeInTheDocument();
    expect(screen.getByText('R$ 50,00')).toBeInTheDocument();
    expect(screen.getByText('R$ 75,00')).toBeInTheDocument();
  });

  it('should render table footer', () => {
    renderTable();

    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
  });

  it('should render correct number of rows', () => {
    renderTable();

    const table = screen.getByRole('table');
    const bodyRows = within(table).getAllByRole('row');
    
    // 1 header row + 2 body rows + 1 footer row = 4
    expect(bodyRows).toHaveLength(4);
  });

  it('should apply custom className to table', () => {
    render(
      <Table className="custom-table">
        <TableBody>
          <TableRow>
            <TableCell>Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );

    expect(screen.getByRole('table')).toHaveClass('custom-table');
  });

  it('should render empty table', () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Column</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody />
      </Table>
    );

    expect(screen.getByRole('table')).toBeInTheDocument();
  });
});
