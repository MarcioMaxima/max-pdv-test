import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DollarSign, TrendingUp, ShoppingCart, Calendar, Eye, Percent, AlertCircle } from "lucide-react";
import { useSupabaseOrders } from "@/hooks/useSupabaseOrders";
import { useSyncedCompanySettings } from "@/hooks/useSyncedCompanySettings";
import { useAuth } from "@/hooks/useAuth";
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Comissoes() {
  const { orders, isLoading: isLoadingOrders } = useSupabaseOrders();
  const { settings, isLoading: isLoadingSettings } = useSyncedCompanySettings();
  const { authUser } = useAuth();
  
  const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), 'yyyy-MM'));
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  // Get orders for current user in selected month
  const myOrders = useMemo(() => {
    if (!authUser || !orders) return [];
    
    const [year, month] = selectedMonth.split('-').map(Number);
    const monthStart = startOfMonth(new Date(year, month - 1));
    const monthEnd = endOfMonth(new Date(year, month - 1));
    
    return orders.filter(order => {
      // Filter by seller (current user)
      const isMyOrder = order.sellerId === authUser.id;
      
      // Filter by date
      const orderDate = parseISO(order.createdAt);
      const isInMonth = isWithinInterval(orderDate, { start: monthStart, end: monthEnd });
      
      // Only paid or partial orders count for commission
      const hasPaidAmount = (order.amountPaid || 0) > 0;
      
      return isMyOrder && isInMonth && hasPaidAmount;
    });
  }, [orders, authUser, selectedMonth]);

  // Calculate commission stats
  const stats = useMemo(() => {
    const commissionRate = (settings?.commissionPercentage || 0) / 100;
    
    const totalSales = myOrders.reduce((sum, order) => sum + (order.amountPaid || 0), 0);
    const totalCommission = totalSales * commissionRate;
    const ordersCount = myOrders.length;
    
    return {
      totalSales,
      totalCommission,
      ordersCount,
      commissionRate: settings?.commissionPercentage || 0,
    };
  }, [myOrders, settings]);

  const isLoading = isLoadingOrders || isLoadingSettings;

  // Check if commission is enabled
  if (!isLoading && !settings?.usesCommission) {
    return (
      <MainLayout title="Minhas Comissões">
        <Card className="p-8">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">Comissões Desativadas</h3>
            <p className="text-muted-foreground max-w-md">
              O sistema de comissões não está ativado. Entre em contato com o administrador 
              para habilitar o cálculo de comissões sobre suas vendas.
            </p>
          </div>
        </Card>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Minhas Comissões">
      <div className="space-y-6">
        {/* Month Filter */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Período:</span>
          </div>
          <Input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-48"
          />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total em Vendas</p>
                {isLoading ? (
                  <Skeleton className="h-6 w-24" />
                ) : (
                  <p className="text-xl font-bold">
                    R$ {stats.totalSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                )}
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Comissão a Receber</p>
                {isLoading ? (
                  <Skeleton className="h-6 w-24" />
                ) : (
                  <p className="text-xl font-bold text-green-500">
                    R$ {stats.totalCommission.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                )}
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <ShoppingCart className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Vendas no Período</p>
                {isLoading ? (
                  <Skeleton className="h-6 w-12" />
                ) : (
                  <p className="text-xl font-bold">{stats.ordersCount}</p>
                )}
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                <Percent className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Comissão</p>
                {isLoading ? (
                  <Skeleton className="h-6 w-12" />
                ) : (
                  <p className="text-xl font-bold">{stats.commissionRate}%</p>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Orders Table */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Vendas com Comissão</h3>
            <Button variant="outline" size="sm" onClick={() => setDetailsDialogOpen(true)}>
              <Eye className="h-4 w-4 mr-2" />
              Ver Detalhes
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : myOrders.length === 0 ? (
            <div className="text-center py-12">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <ShoppingCart className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="font-medium">Nenhuma venda no período</p>
              <p className="text-sm text-muted-foreground">
                Suas vendas com pagamento aparecerão aqui.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pedido</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-right">Valor Pago</TableHead>
                    <TableHead className="text-right">Comissão</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myOrders.slice(0, 10).map((order) => {
                    const commission = (order.amountPaid || 0) * (stats.commissionRate / 100);
                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-sm">{order.id}</TableCell>
                        <TableCell>
                          {format(parseISO(order.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                        </TableCell>
                        <TableCell>{order.customerName}</TableCell>
                        <TableCell className="text-right">
                          R$ {(order.amountPaid || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right text-green-500 font-medium">
                          R$ {commission.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {myOrders.length > 10 && (
                <p className="text-sm text-muted-foreground text-center mt-4">
                  Mostrando 10 de {myOrders.length} vendas. Clique em "Ver Detalhes" para ver todas.
                </p>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Detalhes de Comissões - {format(new Date(selectedMonth + '-01'), 'MMMM yyyy', { locale: ptBR })}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Total em Vendas</p>
                <p className="text-lg font-bold">
                  R$ {stats.totalSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Comissão Total ({stats.commissionRate}%)</p>
                <p className="text-lg font-bold text-green-500">
                  R$ {stats.totalCommission.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="text-right">Valor Pago</TableHead>
                  <TableHead className="text-right">Comissão</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myOrders.map((order) => {
                  const commission = (order.amountPaid || 0) * (stats.commissionRate / 100);
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-sm">{order.id}</TableCell>
                      <TableCell>
                        {format(parseISO(order.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </TableCell>
                      <TableCell>{order.customerName}</TableCell>
                      <TableCell className="text-right">
                        R$ {(order.amountPaid || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right text-green-500 font-medium">
                        R$ {commission.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
