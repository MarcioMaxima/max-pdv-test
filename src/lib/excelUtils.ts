import * as XLSX from 'xlsx';
import { Product, Customer } from '@/lib/types';

// ============= CUSTOMERS EXCEL =============

export interface CustomerImportRow {
  nome: string;
  telefone: string;
  cpf_cnpj?: string;
  email?: string;
  observacoes?: string;
}

export const exportCustomersToExcel = (customers: Customer[]) => {
  const exportData = customers.map(c => ({
    nome: c.name,
    cpf_cnpj: c.doc || '',
    telefone: c.phone || '',
    email: c.email || '',
    observacoes: c.notes || '',
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(exportData);
  
  ws['!cols'] = [
    { wch: 35 }, // nome
    { wch: 20 }, // cpf_cnpj
    { wch: 18 }, // telefone
    { wch: 30 }, // email
    { wch: 40 }, // observacoes
  ];
  
  XLSX.utils.book_append_sheet(wb, ws, 'Clientes');
  
  const date = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `clientes_${date}.xlsx`);
};

export const generateCustomerTemplate = () => {
  const templateData = [
    {
      nome: 'Maria da Silva',
      cpf_cnpj: '123.456.789-00',
      telefone: '(11) 99999-8888',
      email: 'maria@email.com',
      observacoes: 'Cliente VIP'
    },
    {
      nome: 'Empresa ABC Ltda',
      cpf_cnpj: '12.345.678/0001-99',
      telefone: '(11) 3333-4444',
      email: 'contato@empresaabc.com.br',
      observacoes: 'Pagamento a prazo'
    },
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(templateData);
  
  ws['!cols'] = [
    { wch: 35 }, // nome
    { wch: 20 }, // cpf_cnpj
    { wch: 18 }, // telefone
    { wch: 30 }, // email
    { wch: 40 }, // observacoes
  ];
  
  XLSX.utils.book_append_sheet(wb, ws, 'Clientes');
  
  // Create instructions sheet
  const instructions = [
    { Coluna: 'nome', Descrição: 'Nome do cliente (obrigatório)', Exemplo: 'Maria da Silva' },
    { Coluna: 'cpf_cnpj', Descrição: 'CPF ou CNPJ (opcional)', Exemplo: '123.456.789-00 ou 12.345.678/0001-99' },
    { Coluna: 'telefone', Descrição: 'Telefone (obrigatório)', Exemplo: '(11) 99999-8888' },
    { Coluna: 'email', Descrição: 'E-mail (opcional)', Exemplo: 'cliente@email.com' },
    { Coluna: 'observacoes', Descrição: 'Observações (opcional)', Exemplo: 'Cliente VIP, pagamento à vista' },
  ];
  
  const wsInstructions = XLSX.utils.json_to_sheet(instructions);
  wsInstructions['!cols'] = [
    { wch: 15 },
    { wch: 40 },
    { wch: 45 },
  ];
  
  XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instruções');
  
  XLSX.writeFile(wb, 'template_clientes.xlsx');
};

export const parseCustomersExcel = (file: File): Promise<CustomerImportRow[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);
        
        const customers: CustomerImportRow[] = jsonData.map((row, index) => {
          const nome = String(row.nome || '').trim();
          const telefone = String(row.telefone || '').trim();
          
          if (!nome) {
            throw new Error(`Linha ${index + 2}: Nome é obrigatório`);
          }
          if (!telefone) {
            throw new Error(`Linha ${index + 2}: Telefone é obrigatório`);
          }
          
          return {
            nome,
            telefone,
            cpf_cnpj: row.cpf_cnpj ? String(row.cpf_cnpj).trim() : undefined,
            email: row.email ? String(row.email).trim() : undefined,
            observacoes: row.observacoes ? String(row.observacoes).trim() : undefined,
          };
        });
        
        resolve(customers);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Erro ao ler o arquivo'));
    };
    
    reader.readAsBinaryString(file);
  });
};

// ============= PRODUCTS EXCEL =============

export interface ProductImportRow {
  id?: string;
  nome: string;
  categoria: string;
  subcategoria?: string;
  preco: number;
  estoque: number;
  tipo: 'produto' | 'servico';
  modo_calculo: 'quantidade' | 'medidor';
  descricao?: string;
}

export const exportProductsToExcel = (products: Product[]) => {
  const exportData = products.map(p => ({
    id: p.id,
    nome: p.name,
    categoria: p.category,
    subcategoria: p.subcategory || '',
    preco: p.price,
    estoque: p.stock,
    tipo: p.type === 'service' ? 'servico' : 'produto',
    modo_calculo: p.pricing_mode === 'medidor' ? 'medidor' : 'quantidade',
    descricao: p.description || '',
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(exportData);
  
  ws['!cols'] = [
    { wch: 38 }, // id
    { wch: 30 }, // nome
    { wch: 20 }, // categoria
    { wch: 20 }, // subcategoria
    { wch: 12 }, // preco
    { wch: 10 }, // estoque
    { wch: 10 }, // tipo
    { wch: 15 }, // modo_calculo
    { wch: 40 }, // descricao
  ];
  
  XLSX.utils.book_append_sheet(wb, ws, 'Produtos');
  
  const date = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `produtos_${date}.xlsx`);
};

export const generateProductTemplate = () => {
  // Create sample data for template
  const templateData = [
    {
      id: '',
      nome: 'Cartão de Visita 4x4',
      categoria: 'Impressos',
      subcategoria: 'Cartões',
      preco: 89.90,
      estoque: 100,
      tipo: 'produto',
      modo_calculo: 'quantidade',
      descricao: 'Cartão de visita colorido frente e verso'
    },
    {
      id: '',
      nome: 'Banner Lona 440g',
      categoria: 'Comunicação Visual',
      subcategoria: 'Banners',
      preco: 45.00,
      estoque: 50,
      tipo: 'produto',
      modo_calculo: 'medidor',
      descricao: 'Banner em lona 440g por m²'
    },
    {
      id: '',
      nome: 'Adesivo Vinil',
      categoria: 'Comunicação Visual',
      subcategoria: 'Adesivos',
      preco: 35.00,
      estoque: 200,
      tipo: 'produto',
      modo_calculo: 'medidor',
      descricao: 'Adesivo vinil por m²'
    },
    {
      id: '',
      nome: 'Design de Logo',
      categoria: 'Serviços',
      subcategoria: 'Design',
      preco: 250.00,
      estoque: 0,
      tipo: 'servico',
      modo_calculo: 'quantidade',
      descricao: 'Criação de logotipo profissional'
    }
  ];

  // Create workbook
  const wb = XLSX.utils.book_new();
  
  // Create main data sheet
  const ws = XLSX.utils.json_to_sheet(templateData);
  
  // Set column widths
  ws['!cols'] = [
    { wch: 38 }, // id
    { wch: 30 }, // nome
    { wch: 20 }, // categoria
    { wch: 20 }, // subcategoria
    { wch: 12 }, // preco
    { wch: 10 }, // estoque
    { wch: 10 }, // tipo
    { wch: 15 }, // modo_calculo
    { wch: 40 }, // descricao
  ];
  
  XLSX.utils.book_append_sheet(wb, ws, 'Produtos');
  
  // Create instructions sheet
  const instructions = [
    { Coluna: 'id', Descrição: 'ID do produto (deixe vazio para novo, preencha para atualizar)', Exemplo: 'abc123-def456-...' },
    { Coluna: 'nome', Descrição: 'Nome do produto/serviço (obrigatório)', Exemplo: 'Cartão de Visita 4x4' },
    { Coluna: 'categoria', Descrição: 'Categoria principal (obrigatório)', Exemplo: 'Impressos, Comunicação Visual, Serviços' },
    { Coluna: 'subcategoria', Descrição: 'Subcategoria (opcional)', Exemplo: 'Cartões, Banners, Adesivos' },
    { Coluna: 'preco', Descrição: 'Preço unitário (obrigatório)', Exemplo: '89.90' },
    { Coluna: 'estoque', Descrição: 'Quantidade em estoque (0 para serviços)', Exemplo: '100' },
    { Coluna: 'tipo', Descrição: 'produto ou servico (obrigatório)', Exemplo: 'produto' },
    { Coluna: 'modo_calculo', Descrição: 'quantidade ou medidor (obrigatório)', Exemplo: 'quantidade' },
    { Coluna: 'descricao', Descrição: 'Descrição detalhada (opcional)', Exemplo: 'Cartão colorido frente e verso' },
  ];
  
  const wsInstructions = XLSX.utils.json_to_sheet(instructions);
  wsInstructions['!cols'] = [
    { wch: 15 },
    { wch: 55 },
    { wch: 40 },
  ];
  
  XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instruções');
  
  // Download file
  XLSX.writeFile(wb, 'template_produtos.xlsx');
};

export const parseProductsExcel = (file: File): Promise<ProductImportRow[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        // Get first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);
        
        // Validate and transform data
        const products: ProductImportRow[] = jsonData.map((row, index) => {
          const id = row.id ? String(row.id).trim() : undefined;
          const nome = String(row.nome || '').trim();
          const categoria = String(row.categoria || '').trim();
          const preco = parseFloat(String(row.preco || '0'));
          
          if (!nome) {
            throw new Error(`Linha ${index + 2}: Nome é obrigatório`);
          }
          if (!categoria) {
            throw new Error(`Linha ${index + 2}: Categoria é obrigatória`);
          }
          if (isNaN(preco) || preco < 0) {
            throw new Error(`Linha ${index + 2}: Preço inválido`);
          }
          
          const tipoRaw = String(row.tipo || 'produto').toLowerCase().trim();
          const tipo = tipoRaw === 'servico' || tipoRaw === 'serviço' ? 'servico' : 'produto';
          
          const modoRaw = String(row.modo_calculo || 'quantidade').toLowerCase().trim();
          const modo_calculo = modoRaw === 'medidor' ? 'medidor' : 'quantidade';
          
          return {
            id,
            nome,
            categoria,
            subcategoria: row.subcategoria ? String(row.subcategoria).trim() : undefined,
            preco,
            estoque: parseInt(String(row.estoque || '0')) || 0,
            tipo: tipo as 'produto' | 'servico',
            modo_calculo: modo_calculo as 'quantidade' | 'medidor',
            descricao: row.descricao ? String(row.descricao).trim() : undefined,
          };
        });
        
        resolve(products);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Erro ao ler o arquivo'));
    };
    
    reader.readAsBinaryString(file);
  });
};
